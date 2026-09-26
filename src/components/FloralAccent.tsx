import { useId } from "react";

/** Red roses and six-petalled white lilies continue the scene's floral arrangement. */
export function FloralAccent({ className = "" }: { className?: string }) {
  const id = useId();
  return <svg className={`floral-accent ${className}`} viewBox="0 0 200 260" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-rose`} x2=".8" y2="1"><stop stopColor="#f6535e" /><stop offset=".42" stopColor="#c51636" /><stop offset="1" stopColor="#590d25" /></linearGradient>
      <linearGradient id={`${id}-ivory`} x2=".7" y2="1"><stop stopColor="#ffffff" /><stop offset=".68" stopColor="#fff9ef" /><stop offset="1" stopColor="#c5bf91" /></linearGradient>
      <linearGradient id={`${id}-leaf`}><stop stopColor="#183b28" /><stop offset="1" stopColor="#53754b" /></linearGradient>
    </defs>
    <g fill="none" stroke="#688565" strokeWidth="2"><path d="M108 257Q90 122 43 62M111 258Q122 142 162 96M107 252Q73 159 33 147M113 244Q160 198 174 164M105 252Q112 125 100 37" /></g>
    {[ [71,119,-48], [110,173,38], [81,193,-70], [128,139,50], [124,222,75], [96,89,-15] ].map(([x,y,r],i)=><g key={i} transform={`translate(${x} ${y}) rotate(${r})`}><path d="M0 25Q-29-8 0-37Q23-7 0 25Z" fill={`url(#${id}-leaf)`}/><path d="M0 19V-28" stroke="#b3c796" opacity=".4" fill="none"/></g>)}
    {[ [48,69,.95,0], [106,44,.91,1], [158,87,.8,0], [77,118,.76,0], [130,131,.86,1], [36,157,.76,1], [82,187,.81,0], [165,176,.72,0], [133,213,.6,0] ].map(([x,y,s,kind],i)=><g key={i} transform={`translate(${x} ${y}) scale(${s}) rotate(${i*29})`}>
      {Array.from({length:kind===0?4:1},(_,layer)=><g key={layer} transform={`rotate(${layer*28}) scale(${1-layer*.2})`}>
        {Array.from({length:kind===0?8:6},(_,p)=><g key={p} transform={`rotate(${p*360/(kind===0?8:6)})`}>
          <path d={kind===0?'M0 5C-24-3-30-28-14-35C4-47 27-23 0 5Z':'M0 6C-8-7-22-24 0-46C21-22 8-9 0 6Z'} fill={`url(#${id}-${kind===0?'rose':'ivory'})`} stroke={kind===0?'#590d2580':'#d5cdae'} strokeWidth=".7" />
          {kind===1 && <path d="M0 0Q-3-13 0-34" fill="none" stroke="#aab67b" strokeWidth=".8" opacity=".65" />}
        </g>)}
      </g>)}
      {kind===0 ? <path d="M-4 2Q-9-10 4-7Q13 0 0 9Q-7 4-4 2Z" fill="#790e2a" stroke="#ec4357" strokeWidth="1.3" /> : <g>
        {Array.from({length:6},(_,p)=><g key={p} transform={`rotate(${p*60+15})`}><path d="M0 3Q-3-6 1-16" fill="none" stroke="#d2b86e" strokeWidth="1.4"/><ellipse cx="1" cy="-16" rx="2.3" ry="4" fill="#894826" /></g>)}
        <circle r="3" fill="#a3ac64" />
      </g>}
    </g>)}
  </svg>;
}
