"""Evaluate held-out human-labelled predictions, never fabricate missing scores.
JSONL: split, speaker_id, child, noise, human_score, predicted_score,
human_pass, predicted_pass, latency_ms, phone_errors [{actual,predicted}].
"""
import argparse
import json
import numpy as np

def metrics(rows):
    pairs=[(r['human_score'],r['predicted_score']) for r in rows if r.get('human_score') is not None and r.get('predicted_score') is not None]
    positives=[r for r in rows if r.get('human_pass') is True]
    negatives=[r for r in rows if r.get('human_pass') is False]
    phones=[p for r in rows for p in r.get('phone_errors',[]) if p.get('predicted') is not None]
    return {'count':len(rows),'score_coverage':len(pairs)/len(rows) if rows else None,
      'pearson':float(np.corrcoef(np.array(pairs).T)[0,1]) if len(pairs)>2 and all(np.std(x)>0 for x in np.array(pairs).T) else None,
      'false_acceptance':sum(r.get('predicted_pass') is True for r in negatives)/len(negatives) if negatives else None,
      'false_rejection':sum(r.get('predicted_pass') is False for r in positives)/len(positives) if positives else None,
      'phone_error_precision':sum(p['actual'] and p['predicted'] for p in phones)/max(1,sum(p['predicted'] for p in phones)),
      'latency_p95_ms':float(np.percentile([r['latency_ms'] for r in rows],95)) if rows else None}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('predictions');parser.add_argument('--training-speakers',required=True);args=parser.parse_args()
    rows=[json.loads(line) for line in open(args.predictions,encoding='utf-8') if line.strip()]
    train=set(json.load(open(args.training_speakers,encoding='utf-8')))
    if any(r['split']!='test' or r['speaker_id'] in train for r in rows):raise SystemExit('Test/training leakage detected')
    print(json.dumps({'all':metrics(rows),'children':metrics([r for r in rows if r.get('child')]),'noise':metrics([r for r in rows if r.get('noise')])},indent=2))
