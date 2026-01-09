import { motion } from 'framer-motion'

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-dark-300 flex flex-col items-center justify-center">
      {/* SVG Blocks Shuffle Animation */}
      <div className="w-24 h-24">
        <svg
          viewBox="0 0 36 36"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <style>
            {`
              .box5532 {
                fill: currentColor;
                transform-origin: 50% 50%;
              }

              @keyframes box5532-1 {
                9.09% { transform: translate(-12px, 0); }
                18.18% { transform: translate(0px, 0); }
                27.27% { transform: translate(0px, 0); }
                36.36% { transform: translate(12px, 0); }
                45.45% { transform: translate(12px, 12px); }
                54.55% { transform: translate(12px, 12px); }
                63.64% { transform: translate(12px, 12px); }
                72.73% { transform: translate(12px, 0px); }
                81.82% { transform: translate(0px, 0px); }
                90.91% { transform: translate(-12px, 0px); }
                100% { transform: translate(0px, 0px); }
              }

              @keyframes box5532-2 {
                9.09% { transform: translate(0, 0); }
                18.18% { transform: translate(12px, 0); }
                27.27% { transform: translate(0px, 0); }
                36.36% { transform: translate(12px, 0); }
                45.45% { transform: translate(12px, 12px); }
                54.55% { transform: translate(12px, 12px); }
                63.64% { transform: translate(12px, 12px); }
                72.73% { transform: translate(12px, 12px); }
                81.82% { transform: translate(0px, 12px); }
                90.91% { transform: translate(0px, 12px); }
                100% { transform: translate(0px, 0px); }
              }

              @keyframes box5532-3 {
                9.09% { transform: translate(-12px, 0); }
                18.18% { transform: translate(-12px, 0); }
                27.27% { transform: translate(0px, 0); }
                36.36% { transform: translate(-12px, 0); }
                45.45% { transform: translate(-12px, 0); }
                54.55% { transform: translate(-12px, 0); }
                63.64% { transform: translate(-12px, 0); }
                72.73% { transform: translate(-12px, 0); }
                81.82% { transform: translate(-12px, -12px); }
                90.91% { transform: translate(0px, -12px); }
                100% { transform: translate(0px, 0px); }
              }

              @keyframes box5532-4 {
                9.09% { transform: translate(-12px, 0); }
                18.18% { transform: translate(-12px, 0); }
                27.27% { transform: translate(-12px, -12px); }
                36.36% { transform: translate(0px, -12px); }
                45.45% { transform: translate(0px, 0px); }
                54.55% { transform: translate(0px, -12px); }
                63.64% { transform: translate(0px, -12px); }
                72.73% { transform: translate(0px, -12px); }
                81.82% { transform: translate(-12px, -12px); }
                90.91% { transform: translate(-12px, 0px); }
                100% { transform: translate(0px, 0px); }
              }

              @keyframes box5532-5 {
                9.09% { transform: translate(0, 0); }
                18.18% { transform: translate(0, 0); }
                27.27% { transform: translate(0, 0); }
                36.36% { transform: translate(12px, 0); }
                45.45% { transform: translate(12px, 0); }
                54.55% { transform: translate(12px, 0); }
                63.64% { transform: translate(12px, 0); }
                72.73% { transform: translate(12px, 0); }
                81.82% { transform: translate(12px, -12px); }
                90.91% { transform: translate(0px, -12px); }
                100% { transform: translate(0px, 0px); }
              }

              @keyframes box5532-6 {
                9.09% { transform: translate(0, 0); }
                18.18% { transform: translate(-12px, 0); }
                27.27% { transform: translate(-12px, 0); }
                36.36% { transform: translate(0px, 0); }
                45.45% { transform: translate(0px, 0); }
                54.55% { transform: translate(0px, 0); }
                63.64% { transform: translate(0px, 0); }
                72.73% { transform: translate(0px, 12px); }
                81.82% { transform: translate(-12px, 12px); }
                90.91% { transform: translate(-12px, 0px); }
                100% { transform: translate(0px, 0px); }
              }

              @keyframes box5532-7 {
                9.09% { transform: translate(12px, 0); }
                18.18% { transform: translate(12px, 0); }
                27.27% { transform: translate(12px, 0); }
                36.36% { transform: translate(0px, 0); }
                45.45% { transform: translate(0px, -12px); }
                54.55% { transform: translate(12px, -12px); }
                63.64% { transform: translate(0px, -12px); }
                72.73% { transform: translate(0px, -12px); }
                81.82% { transform: translate(0px, 0px); }
                90.91% { transform: translate(12px, 0px); }
                100% { transform: translate(0px, 0px); }
              }

              @keyframes box5532-8 {
                9.09% { transform: translate(0, 0); }
                18.18% { transform: translate(-12px, 0); }
                27.27% { transform: translate(-12px, -12px); }
                36.36% { transform: translate(0px, -12px); }
                45.45% { transform: translate(0px, -12px); }
                54.55% { transform: translate(0px, -12px); }
                63.64% { transform: translate(0px, -12px); }
                72.73% { transform: translate(0px, -12px); }
                81.82% { transform: translate(12px, -12px); }
                90.91% { transform: translate(12px, 0px); }
                100% { transform: translate(0px, 0px); }
              }

              @keyframes box5532-9 {
                9.09% { transform: translate(-12px, 0); }
                18.18% { transform: translate(-12px, 0); }
                27.27% { transform: translate(0px, 0); }
                36.36% { transform: translate(-12px, 0); }
                45.45% { transform: translate(0px, 0); }
                54.55% { transform: translate(0px, 0); }
                63.64% { transform: translate(-12px, 0); }
                72.73% { transform: translate(-12px, 0); }
                81.82% { transform: translate(-24px, 0); }
                90.91% { transform: translate(-12px, 0); }
                100% { transform: translate(0px, 0); }
              }

              .box5532:nth-child(1) { animation: box5532-1 4s infinite; }
              .box5532:nth-child(2) { animation: box5532-2 4s infinite; }
              .box5532:nth-child(3) { animation: box5532-3 4s infinite; }
              .box5532:nth-child(4) { animation: box5532-4 4s infinite; }
              .box5532:nth-child(5) { animation: box5532-5 4s infinite; }
              .box5532:nth-child(6) { animation: box5532-6 4s infinite; }
              .box5532:nth-child(7) { animation: box5532-7 4s infinite; }
              .box5532:nth-child(8) { animation: box5532-8 4s infinite; }
              .box5532:nth-child(9) { animation: box5532-9 4s infinite; }
            `}
          </style>
          <g className="text-accent-primary">
            <rect className="box5532" x="13" y="1" rx="1" width="10" height="10"/>
            <rect className="box5532" x="13" y="1" rx="1" width="10" height="10"/>
            <rect className="box5532" x="25" y="25" rx="1" width="10" height="10"/>
            <rect className="box5532" x="13" y="13" rx="1" width="10" height="10"/>
            <rect className="box5532" x="13" y="13" rx="1" width="10" height="10"/>
            <rect className="box5532" x="25" y="13" rx="1" width="10" height="10"/>
            <rect className="box5532" x="1" y="25" rx="1" width="10" height="10"/>
            <rect className="box5532" x="13" y="25" rx="1" width="10" height="10"/>
            <rect className="box5532" x="25" y="25" rx="1" width="10" height="10"/>
          </g>
        </svg>
      </div>

      {/* Texto de carga */}
      <motion.p
        className="mt-8 text-white/60 text-sm font-medium"
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        Cargando AccesoGym Coach...
      </motion.p>
    </div>
  )
}