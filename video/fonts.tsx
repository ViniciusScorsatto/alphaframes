import {staticFile} from 'remotion';

export function FontStyles() {
  return (
    <style>
      {`
        @font-face {
          font-family: 'Space Grotesk';
          src: url('${staticFile('fonts/SpaceGrotesk-VariableFont_wght.ttf')}') format('truetype');
          font-weight: 300 700;
          font-style: normal;
        }

        @font-face {
          font-family: 'Inter';
          src: url('${staticFile('fonts/Inter-VariableFont_opsz,wght.ttf')}') format('truetype');
          font-weight: 100 900;
          font-style: normal;
        }

        @font-face {
          font-family: 'IBM Plex Mono';
          src: url('${staticFile('fonts/IBMPlexMono-SemiBold.ttf')}') format('truetype');
          font-weight: 600;
          font-style: normal;
        }

        @font-face {
          font-family: 'IBM Plex Mono';
          src: url('${staticFile('fonts/IBMPlexMono-Bold.ttf')}') format('truetype');
          font-weight: 700;
          font-style: normal;
        }
      `}
    </style>
  );
}
