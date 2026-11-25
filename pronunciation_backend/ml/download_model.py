"""Explicit operator action. Verify license BEFORE downloading weights."""
import argparse
from huggingface_hub import HfApi, snapshot_download

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',required=True)
    parser.add_argument('--allow-reviewed-pickle',action='store_true',help='Explicitly permit the pinned official pytorch_model.bin when no safetensors exist')
    args=parser.parse_args()
    repo='facebook/wav2vec2-lv-60-espeak-cv-ft'
    info=HfApi().model_info(repo)
    if info.card_data.get('license')!='apache-2.0':raise SystemExit('License changed: manual review required')
    files=[x.rfilename for x in info.siblings]
    has_safetensors=any(x.endswith('.safetensors') for x in files)
    if not has_safetensors and not args.allow_reviewed_pickle:
        raise SystemExit('No safetensors upstream. Re-run with --allow-reviewed-pickle only after accepting the pinned official pickle weights, then set MODEL_ALLOW_PICKLE=true.')
    print('Pinned revision:',info.sha)
    patterns=['*.json','README.md']+(['*.safetensors'] if has_safetensors else ['pytorch_model.bin'])
    snapshot_download(repo,revision=info.sha,local_dir=args.output,allow_patterns=patterns)
