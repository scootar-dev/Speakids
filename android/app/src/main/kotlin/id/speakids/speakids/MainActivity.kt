package id.speakids.speakids

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebChromeClient
import android.webkit.PermissionRequest
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugin.common.StandardMessageCodec
import io.flutter.plugin.platform.PlatformView
import io.flutter.plugin.platform.PlatformViewFactory
import org.json.JSONObject

class MainActivity : FlutterActivity() {
    private var book: StudentBook? = null

    override fun configureFlutterEngine(engine: FlutterEngine) {
        super.configureFlutterEngine(engine)
        val asset = io.flutter.FlutterInjector.instance().flutterLoader()
            .getLookupKeyForAsset("assets/app/index.html")
        engine.platformViewsController.registry.registerViewFactory(
            "id.speakids/book", object : PlatformViewFactory(StandardMessageCodec.INSTANCE) {
                override fun create(context: Context, id: Int, args: Any?): PlatformView {
                    val view = StudentBook(this@MainActivity, asset, (args as? Map<*, *>)?.get("pronunciationUrl") as? String ?: "")
                    book = view
                    return view
                }
            }
        )
        MethodChannel(engine.dartExecutor.binaryMessenger, "id.speakids/navigation")
            .setMethodCallHandler { call, result ->
                val active = book
                if (call.method != "back") result.notImplemented()
                else if (active == null) result.success(false)
                else active.back { handled -> result.success(handled) }
            }
    }

    override fun onRequestPermissionsResult(code: Int, permissions: Array<out String>, grants: IntArray) {
        super.onRequestPermissionsResult(code, permissions, grants)
        if (code == 401) book?.permissionResult(grants.isNotEmpty() && grants[0] == PackageManager.PERMISSION_GRANTED)
    }
    override fun onStop() {
        book?.background()
        super.onStop()
    }
}

private class StudentBook(private val activity: Activity, asset: String, private val pronunciationUrl: String) : PlatformView {
    private var audioPermission: PermissionRequest? = null
    private val web = WebView(activity)
    private val main = Handler(Looper.getMainLooper())
    private var recognizer: SpeechRecognizer? = null
    private var requestId: Int? = null
    private var waitingForPermission = false
    private var disposed = false

    init {
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                main.post {
                    if (request.origin.toString() != "https://appassets.androidplatform.net/" ||
                        !request.resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) { request.deny(); return@post }
                    if (activity.checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED)
                        request.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
                    else { audioPermission?.deny(); audioPermission = request; activity.requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO),401) }
                }
            }
            override fun onPermissionRequestCanceled(request: PermissionRequest) { if (audioPermission === request) audioPermission = null }
        }
        web.settings.allowContentAccess = false
        web.settings.allowFileAccess = false // Bundled android_asset URLs remain accessible.
        web.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView, url: String) {
                if (pronunciationUrl.isNotBlank()) view.evaluateJavascript("window.SPEAKIDS_PRONUNCIATION={baseUrl:" + JSONObject.quote(pronunciationUrl) + "}", null)
            }
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                if (request.url.host != "appassets.androidplatform.net") return null
                val path = request.url.path?.removePrefix("/") ?: return null
                if (path.contains("..")) return WebResourceResponse("text/plain", "UTF-8", null)
                val mime = when (path.substringAfterLast('.')) {
                    "html" -> "text/html"
                    "js" -> "application/javascript"
                    "css" -> "text/css"
                    "png" -> "image/png"
                    "mp3" -> "audio/mpeg"
                    "ttf" -> "font/ttf"
                    else -> "application/octet-stream"
                }
                return try { WebResourceResponse(mime, "UTF-8", activity.assets.open(path)) }
                catch (_: Exception) { WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", emptyMap(), null) }
            }
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean = true
            @Deprecated("Legacy WebView callback")
            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean = true
        }
        web.addJavascriptInterface(object {
            @JavascriptInterface fun postMessage(text: String) {
                val data = try { JSONObject(text) } catch (_: Exception) { return }
                main.post {
                    if (disposed) return@post
                    when (data.optString("action")) {
                        "cancel" -> cancel()
                        "listen" -> request(data.optInt("id"))
                    }
                }
            }
        }, "SpeaNative")
        web.loadUrl("https://appassets.androidplatform.net/$asset")
    }

    fun back(done: (Boolean) -> Unit) {
        if (disposed) { done(false); return }
        web.evaluateJavascript("typeof window.speaBack==='function' && window.speaBack()") { done(it == "true") }
    }
    private fun emit(id: Int, state: String, transcript: String = "") {
        if (disposed || requestId != id) return
        web.evaluateJavascript(
            "window.speaVoice($id,${JSONObject.quote(state)},${JSONObject.quote(transcript)})", null
        )
    }
    private fun request(id: Int) {
        cancel()
        requestId = id
        if (!SpeechRecognizer.isRecognitionAvailable(activity)) {
            emit(id,"unavailable")
            return
        }
        if (activity.checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            waitingForPermission = true
            activity.requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO),401)
        } else start(id)
    }
    fun permissionResult(granted: Boolean) {
        audioPermission?.let { if (granted) it.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) else it.deny(); audioPermission = null; return }
        if (!waitingForPermission || disposed) return
        waitingForPermission = false
        val id = requestId ?: return
        if (granted) start(id) else emit(id,"unavailable")
    }
    private fun start(id: Int) {
        try {
            val speech = SpeechRecognizer.createSpeechRecognizer(activity)
            recognizer = speech
            speech.setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) = emit(id,"listening")
                override fun onBeginningOfSpeech() = Unit
                override fun onRmsChanged(rmsdB: Float) = Unit
                override fun onBufferReceived(buffer: ByteArray?) = Unit
                override fun onEndOfSpeech() = emit(id,"processing")
                override fun onError(error: Int) {
                    val retry = error == SpeechRecognizer.ERROR_NO_MATCH || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT
                    emit(id, if (retry) "retry" else "unavailable")
                    if (requestId == id) cancel()
                }
                override fun onResults(results: Bundle?) {
                    val word = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()
                    if (word.isNullOrBlank()) emit(id,"retry") else emit(id,"final",word)
                    if (requestId == id) cancel()
                }
                override fun onPartialResults(results: Bundle?) = Unit
                override fun onEvent(eventType: Int, params: Bundle?) = Unit
            })
            speech.startListening(Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE,"en-US")
                putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE,true)
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS,1)
            })
        } catch (_: RuntimeException) { emit(id,"unavailable"); cancel() }
    }
    private fun cancel() {
        requestId = null
        waitingForPermission = false
        recognizer?.destroy()
        recognizer = null
    }
    fun background() {
        if (disposed || waitingForPermission) return
        requestId?.let { emit(it,"retry") }
        cancel()
    }
    override fun getView(): View = web
    override fun dispose() {
        audioPermission?.deny()
        audioPermission = null
        disposed = true
        cancel()
        web.removeJavascriptInterface("SpeaNative")
        web.destroy()
    }
}
