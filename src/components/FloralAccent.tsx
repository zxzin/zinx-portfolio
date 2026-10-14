import { useId } from "react";

/** A few settled petals remain between the coins; they never capture input. */
export function TablePetals() {
  return <div className="table-petal-trace" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(index => <i key={index} />)}</div>;
}

/** The gallery repeats the cabinet's roses, lilies, dahlias, cosmos and hydrangeas. */
export function FloralAccent({ className = "" }: { className?: string }) {
  const id = useId();
  return <svg className={`floral-accent ${className}`} viewBox="0 0 200 260" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-rose`} x2=".8" y2="1"><stop stopColor="#f6535e" /><stop offset=".42" stopColor="#c51636" /><stop offset="1" stopColor="#590d25" /></linearGradient>
      <linearGradient id={`${id}-ivory`} x2=".7" y2="1"><stop stopColor="#ffffff" /><stop offset=".68" stopColor="#fff9ef" /><stop offset="1" stopColor="#c5bf91" /></linearGradient>
      <linearGradient id={`${id}-leaf`}><stop stopColor="#183b28" /><stop offset="1" stopColor="#53754b" /></linearGradient>
      <linearGradient id={`${id}-dahlia`} x2=".7" y2="1"><stop stopColor="#ffe0a1" /><stop offset=".5" stopColor="#f6a041" /><stop offset="1" stopColor="#c96126" /></linearGradient>
      <linearGradient id={`${id}-cosmos`} x2=".7" y2="1"><stop stopColor="#ffc3e0" /><stop offset="1" stopColor="#b82e7c" /></linearGradient>
      <linearGradient id={`${id}-hydrangea`} x2=".7" y2="1"><stop stopColor="#c5cfff" /><stop offset="1" stopColor="#7960c5" /></linearGradient>
    </defs>
    <g fill="none" stroke="#688565" strokeWidth="2"><path d="M108 257Q90 122 43 62M111 258Q122 142 162 96M107 252Q73 159 33 147M113 244Q160 198 174 164M105 252Q112 125 100 37" /></g>
    {[ [71,119,-48], [110,173,38], [81,193,-70], [128,139,50], [124,222,75], [96,89,-15] ].map(([x,y,r],i)=><g key={i} transform={`translate(${x} ${y}) rotate(${r})`}><path d="M0 25Q-29-8 0-37Q23-7 0 25Z" fill={`url(#${id}-leaf)`}/><path d="M0 19V-28" stroke="#b3c796" opacity=".4" fill="none"/></g>)}
    {[ [48,69,.95,0], [106,44,.91,1], [158,87,.8,2], [77,118,.76,3], [130,131,.86,4], [36,157,.76,1], [82,187,.81,2], [165,176,.72,0], [133,213,.6,3] ].map(([x,y,s,kind],i)=><g key={i} transform={`translate(${x} ${y}) scale(${s}) rotate(${i*29})`}>
      {Array.from({length:kind===0?4:kind===2?3:1},(_,layer)=><g key={layer} transform={`rotate(${layer*28}) scale(${1-layer*.2})`}>
        {Array.from({length:kind===4?0:kind===2?16:kind===1?6:8},(_,p)=><g key={p} transform={`rotate(${p*360/(kind===2?16:kind===1?6:8)})`}>
          <path d={kind===0?'M0 5C-24-3-30-28-14-35C4-47 27-23 0 5Z':kind===1?'M0 6C-8-7-22-24 0-46C21-22 8-9 0 6Z':kind===2?'M0 4C-8-9-12-29 0-39C12-28 8-10 0 4Z':'M0 4C-18-7-22-33-5-36C6-43 24-20 0 4Z'} fill={`url(#${id}-${kind===0?'rose':kind===1?'ivory':kind===2?'dahlia':'cosmos'})`} stroke={kind===0?'#590d2580':'#fff3d244'} strokeWidth=".7" />
          {kind===1 && <path d="M0 0Q-3-13 0-34" fill="none" stroke="#aab67b" strokeWidth=".8" opacity=".65" />}
        </g>)}
      </g>)}
      {kind===4 && Array.from({length:9},(_,p)=>{ const a=p*2.4,r=Math.sqrt(p)*8; return <g key={p} transform={`translate(${Math.cos(a)*r} ${Math.sin(a)*r}) rotate(${p*25})`}>{[0,90,180,270].map(turn=><path key={turn} transform={`rotate(${turn})`} d="M0 2C-11-4-9-13 0-12C9-13 11-4 0 2Z" fill={`url(#${id}-hydrangea)`} stroke="#d3e5ff" strokeWidth=".5"/>)}<circle r="2" fill="#fff5d2"/></g>; })}
      {kind===0 ? <path d="M-4 2Q-9-10 4-7Q13 0 0 9Q-7 4-4 2Z" fill="#790e2a" stroke="#ec4357" strokeWidth="1.3" /> : kind===1 ? <g>
        {Array.from({length:6},(_,p)=><g key={p} transform={`rotate(${p*60+15})`}><path d="M0 3Q-3-6 1-16" fill="none" stroke="#d2b86e" strokeWidth="1.4"/><ellipse cx="1" cy="-16" rx="2.3" ry="4" fill="#894826" /></g>)}
        <circle r="3" fill="#a3ac64" />
      </g> : kind!==4 && <g><circle r="6" fill="#d7a33e"/>{Array.from({length:9},(_,n)=><circle key={n} cx={Math.sin(n*2.4)*Math.sqrt(n)*1.5} cy={Math.cos(n*2.4)*Math.sqrt(n)*1.5} r=".8" fill="#765127"/>)}</g>}
    </g>)}
  </svg>;
}
