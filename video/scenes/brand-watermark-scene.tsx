import {AbsoluteFill, Img, staticFile} from 'remotion';

export function BrandWatermarkScene() {
  return (
    <AbsoluteFill style={{pointerEvents: 'none', justifyContent: 'flex-end', alignItems: 'flex-end', padding: '0 44px 96px'}}>
      <div
        style={{
          borderRadius: 28,
          padding: '14px 18px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
          border: '1px solid rgba(255,255,255,0.05)',
          opacity: 0.1,
        }}
      >
        <Img
          src={staticFile('branding/alphaframes-logo.svg')}
          style={{width: 112, height: 'auto', display: 'block'}}
        />
      </div>
    </AbsoluteFill>
  );
}
