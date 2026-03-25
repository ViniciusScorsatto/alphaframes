import {AbsoluteFill} from 'remotion';
import {videoTheme} from '../theme';

export function DisclaimerScene() {
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 34, pointerEvents: 'none'}}>
      <div
        style={{
          borderRadius: 999,
          border: `1px solid ${videoTheme.border}`,
          background: 'rgba(8,8,8,0.74)',
          padding: '10px 18px',
          color: videoTheme.secondary,
          fontSize: 20,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        For educational purposes only
      </div>
    </AbsoluteFill>
  );
}
