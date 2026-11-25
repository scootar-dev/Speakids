import numpy as np

class PhonemeAligner:
    """Full CTC Viterbi: blank states, repetitions and skip constraints.

    A forced path is a hypothesis, never proof of correct pronunciation.
    """
    def align(self, log_probs, tokens, blank):
        if not tokens or len(tokens) > 180:
            raise ValueError('unsupported_target_length')
        states = [blank]
        for token in tokens:
            states.extend([token, blank])
        frames, count = len(log_probs), len(states)
        previous = np.full(count, -np.inf)
        previous[0] = log_probs[0, blank]
        previous[1] = log_probs[0, tokens[0]]
        pointers = np.zeros((frames, count), dtype=np.int16)
        for t in range(1, frames):
            current = np.full(count, -np.inf)
            for s, symbol in enumerate(states):
                choices = [s]
                if s: choices.append(s-1)
                if s > 1 and symbol != blank and symbol != states[s-2]: choices.append(s-2)
                source = max(choices, key=lambda p: previous[p])
                pointers[t, s] = source
                current[s] = previous[source] + log_probs[t, symbol]
            previous = current
        state = max([count-1, count-2], key=lambda s: previous[s])
        if not np.isfinite(previous[state]): raise ValueError('alignment_failed')
        path = []
        for t in range(frames-1, -1, -1):
            path.append(state)
            state = int(pointers[t, state])
        path.reverse()
        spans = [[t for t, s in enumerate(path) if s == 2*i+1] for i in range(len(tokens))]
        if any(not span for span in spans): raise ValueError('alignment_failed')
        return spans
