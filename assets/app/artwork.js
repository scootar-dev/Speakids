// Small hand-drawn emblems share an outline, paper highlights and short shadows.
const glyphs = {
  home: '<path d="m3 11 9-8 9 8M5 10v10h5v-6h4v6h5V10"/>',
  gift: '<rect x="3" y="9" width="18" height="4" rx="1"/><path d="M5 13v8h14v-8M12 9v12"/><path d="M12 9c-10 0-6-10-2-5l2 5c10 0 6-10 2-5z"/>',
  game: '<path d="M7 6h10c3 0 5 7 5 11 0 3-3 4-6-1H8c-3 5-6 4-6 1 0-4 2-11 5-11zM7 9v5m-2.5-2.5h5m5-1h.1m3 3h.1"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-8 16-8 16 0"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8l-6.2 3.3L7 14.2 2 9.3l6.9-1z"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  left: '<path d="m15 5-7 7 7 7"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  book: '<path d="M12 6c-3-2-6-2-10-1v14c4-1 7-1 10 1 3-2 6-2 10-1V5c-4-1-7-1-10 1zm0 0v14"/>',
  sound: '<path d="M3 9h4l5-5v16l-5-5H3zM16 8q5 4 0 8m3-11q7 7 0 14"/>',
  mic: '<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 11a7 7 0 0 0 14 0m-7 7v4m-4 0h8"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  play: '<path d="m7 4 13 8-13 8z"/>',
  edit: '<path d="m4 16 12-12 4 4L8 20l-5 1z"/>',
  map: '<path d="m2 6 7-3 6 3 7-3v15l-7 3-6-3-7 3zm7-3v15m6-12v15"/>',
  cloud: '<path d="M17.5 19H9a5 5 0 0 1-.7-9.96A7 7 0 0 1 21.8 14a4 4 0 0 1-4.3 5z"/>',
  trophy: '<path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2m12 6h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2M6 3h12v7a6 6 0 0 1-12 0V3zm3 15v3m6-3v3m-8 0h10"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2l-2 2m0 3v.5"/>'
};
function ico(k) {
  return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + glyphs[k] + '</svg>';
}
const artShape = {
  blocks: '<g transform="rotate(-10 33 60)"><rect x="6" y="39" width="38" height="37" rx="6" fill="#ffa980"/><rect x="11" y="43" width="28" height="28" rx="4" fill="#ffdbc1"/><path d="m18 62 7-14 7 14m-11-4h8" fill="none"/></g><g transform="rotate(10 68 61)"><rect x="47" y="40" width="37" height="35" rx="6" fill="#84cbd2"/><path d="M59 48v17h6q12 0 5-8 7-9-5-9zM60 56h6" fill="none"/></g><g transform="rotate(3 47 28)"><rect x="28" y="7" width="38" height="34" rx="6" fill="#ffd46d"/><path d="M53 18q-13-8-15 5t15 6" fill="none"/></g>',
  apple: '<path d="M44 32q-3-14 9-22" fill="none" stroke="#6b4e32" stroke-width="5"/><path d="M45 27q-21 0-21-17 21-2 21 17z" fill="#89c56b"/><path d="M46 30C16 12 2 41 17 66q13 23 28 13 16 10 28-11 18-34-3-42-12-4-24 4z" fill="#fb7969"/><path d="M22 48q0-9 7-12" fill="none" stroke="white" stroke-width="5"/><path d="M36 55v3m18-3v3m-12 4q4 5 8 0" fill="none"/><circle cx="29" cy="61" r="4" stroke="none" fill="#ffada0"/><circle cx="61" cy="61" r="4" stroke="none" fill="#ffada0"/>',
  book: '<g transform="rotate(-7 45 45)"><path d="M6 26q20-7 38 3 18-11 39-5v47q-22-5-39 6-20-10-38-6z" fill="#a78ae4"/><path d="M8 20q20-6 36 5 17-12 37-7v46q-19-4-37 7-18-11-36-7z" fill="#fff1c8"/><path d="M44 25v46M16 32q10-2 19 3m-19 8q10-2 19 3m18-11q10-6 19-5m-19 15q10-6 19-5" fill="none"/><path d="m59 18 7-2v19l-4-3-3 4z" fill="#f69991"/></g>',
  chat: '<path d="M44 33q36-11 40 13t-12 20l5 10-16-7q-26 1-26-16z" fill="#ffcf74"/><path d="M9 27q0-17 31-17 32 0 32 19v8q0 18-30 19l-18 13 2-14Q6 52 9 27z" fill="#9cded6"/><g fill="#544364" stroke="none"><circle cx="26" cy="33" r="3"/><circle cx="40" cy="33" r="3"/><circle cx="54" cy="33" r="3"/></g>',
  phones: '<path d="M15 51V40C15 0 76 0 76 40v12h-9V40c0-29-44-29-44 0v13z" fill="#a18be9"/><rect x="9" y="42" width="21" height="31" rx="9" transform="rotate(-9 19 56)" fill="#ba97f4"/><rect x="62" y="42" width="21" height="31" rx="9" transform="rotate(9 72 57)" fill="#ba97f4"/><path d="M16 50v12m56-12v12M31 15q13-8 26-3" stroke="white" fill="none"/><path d="M41 46v14l10-4V41z" fill="#ffd76d"/><circle cx="38" cy="62" r="4" fill="#ffd76d"/>',
  cards: '<g transform="rotate(-13 34 42)"><rect x="8" y="12" width="48" height="58" rx="6" fill="#ffca8c"/><path d="M14 21h35v36H14z" fill="#fff0d1"/></g><g transform="rotate(8 58 50)"><rect x="31" y="20" width="49" height="58" rx="6" fill="#fbf8e9"/><rect x="37" y="26" width="37" height="37" rx="3" fill="#addce7"/><circle cx="47" cy="36" r="5" fill="#ffcb64"/><path d="m38 55 10-9 7 4 7-11 11 14v9H38z" fill="#92c782"/></g>',
  mic: '<g transform="rotate(21 45 45)"><rect x="40" y="49" width="12" height="33" rx="5" fill="#9f80da"/><rect x="28" y="8" width="35" height="51" rx="17" fill="#bd9ded"/><path d="M29 30h13m20 0H51m-21 9h10m21 0H51m-29 2q1 25 24 25t23-25" fill="none"/><path d="M35 23q2-8 10-9" stroke="#fff5ff" fill="none"/></g>'
};
function art(k) {
  return '<svg class="art" viewBox="0 0 90 90" aria-hidden="true"><ellipse cx="45" cy="79" rx="32" ry="5" fill="#604a72" opacity=".12"/><g stroke="#544364" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round">' + (artShape[k] || artShape.book) + '</g></svg>';
}
function imageWord(item) {
  if (['Good morning!', 'Good afternoon!', 'See you!'].includes(item.en)) return storyScene('greeting');
  if (['I have a book.', 'I read a book.'].includes(item.en)) return storyScene('book');
  if (item.en === 'Xylophone') return '<svg class="story" viewBox="0 0 260 130" aria-hidden="true"><g transform="rotate(-8 130 65)" stroke="#574962" stroke-width="2"><path d="M44 47h171v52H44z" fill="#d5a67e"/>' + ['#f38f82', '#f3b579', '#f1d67c', '#a3d8aa', '#82caca', '#9996da', '#c096d8'].map((c, i) => '<rect x="' + (46 + 24 * i) + '" y="' + (33 + 3 * i) + '" width="21" height="' + (74 - 6 * i) + '" rx="6" fill="' + c + '"/>').join('') + '<path d="m75 18 92 18" stroke-width="5"/><circle cx="72" cy="17" r="8" fill="#faac96"/></g></svg>';
  const chars = [...(item.pic || '')].filter(c => ART[c]);
  if (!chars.length) return '<div class="object" aria-hidden="true">' + String(item.pic || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) + '</div>';
  if (chars.length === 1) return '<div class="object"><img alt="" src="art/' + ART[chars[0]] + '"></div>';
  return '<div class="scene"><i></i>' + chars.map(c => '<img alt="" src="art/' + ART[c] + '">').join('') + '</div>';
}
function hills() {
  return '<svg class="hills" viewBox="0 0 500 112" preserveAspectRatio="none" aria-hidden="true"><path d="M-20 64Q85 3 207 65t203-20 125 17v100H-20z" fill="#c4ddbe"/><path d="M-15 92Q105 33 229 81t206-16 95 2v70H-15z" fill="#98cfae"/><path d="M-8 105q16-27 29-18-1-21 13-23 13 1 15 28 15-20 24 0 9 20 18 16m312 6q-1-24 12-24 11 0 12 13 4-32 18-32 12 1 12 26 15-17 25-6l23 23" fill="#71b59d"/><g fill="#fff2be"><circle cx="55" cy="98" r="3"/><circle cx="69" cy="104" r="2"/><circle cx="385" cy="88" r="3"/></g></svg>';
}
function childFigure(x, y, style, gesture) {
  const hair = style ? '#513449' : '#473445',
    shirt = style ? '#ffb181' : '#9a87d4',
    skin = style ? '#b67c5b' : '#e2ad83';
  const arm = gesture === 'wave' ? 'M17 13q19 0 22-25' : gesture === 'book' ? 'M16 16q12 11 1 13' : 'M16 15q10 10 12 17';
  return '<g transform="translate(' + x + ' ' + y + ')" stroke="#544454" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3"><path d="m-10 36-2 18m22-18 3 18" stroke="' + skin + '" stroke-width="8"/><path d="m-17 55 8 1m19-1 8 1" stroke-width="7"/><path d="M-13 6q13-6 26 0l7 25-10 3H-9l-11-4z" fill="' + shirt + '"/><path d="m-15 33 30 0-3 10H2l-2-6-3 6h-11z" fill="#66849c"/><path d="M-16 14q-9 12-9 18" stroke="' + skin + '" fill="none" stroke-width="7"/><path d="' + arm + '" stroke="' + skin + '" fill="none" stroke-width="7"/>' + (style ? '<g fill="' + hair + '"><circle cx="-21" cy="-19" r="10"/><circle cx="22" cy="-17" r="9"/></g>' : '') + '<ellipse cx="0" cy="-17" rx="23" ry="23" fill="' + skin + '"/><path d="M-22-15q-10-34 21-32 29-1 26 29l-10-6-3-9q-9 15-20 13l4-8q-9 11-18 13z" fill="' + hair + '"/><path d="m-9-16 0 2m19-2 0 2m-14 5q5 6 11 0" fill="none"/><g fill="#e78e88" stroke="none"><ellipse cx="-14" cy="-9" rx="4" ry="2"/><ellipse cx="16" cy="-9" rx="4" ry="2"/></g>' + (gesture === 'book' ? '<g transform="rotate(-8 3 20)"><path d="M-9 10h25v24H-9z" fill="#69a6ce"/><path d="M-4 10v24m4-17h10" fill="none" stroke="#e4f5ff"/><path d="M14 25q9-3 8 1t-8 3" fill="' + skin + '"/></g>' : '') + '</g>';
}
function storyScene(kind) {
  const school = kind === 'greeting';
  return '<svg class="story" viewBox="0 0 320 165" aria-hidden="true"><rect width="320" height="165" rx="18" fill="#d5edf2"/><circle cx="48" cy="33" r="19" fill="#ffd36e"/><path d="M211 28q3-10 13-7 10-15 21 0 13-4 15 7zM60 54q1-8 10-6 8-10 16-1 9-3 13 7z" fill="#fffaf4"/><path d="M0 110q80-36 153 0t167-7v62H0z" fill="#bbe1af"/><path d="M0 135q89-34 185 0t135-8v38H0z" fill="#9fd1ac"/>' + (school ? '<g stroke="#a47b75" stroke-width="2"><path d="M118 58h85v53h-85z" fill="#ffe1ac"/><path d="m109 60 51-28 52 28z" fill="#cf8181"/><path d="M149 82h21v29h-21z" fill="#86a6bb"/><path d="M126 72h14v13h-14zm52 0h15v13h-15z" fill="#c3eaf2"/></g>' : '<path d="M20 108V70m268 59V66" stroke="#a67b59" stroke-width="7"/><g fill="#90c592"><circle cx="17" cy="65" r="25"/><circle cx="291" cy="56" r="31"/></g>') + (school ? childFigure(88, 99, 0, 'wave') + childFigure(219, 105, 1, 'wave') : childFigure(162, 99, 1, 'book')) + '<path d="m26 143 2-8 4 7m220 10 3-9 3 7" stroke="#72ac83" fill="none" stroke-width="3"/></svg>';
}
