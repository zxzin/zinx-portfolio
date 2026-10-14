import { useId, type Ref } from "react";
import type { Exhibit } from "../lib/exhibition-model";
import { assetPath } from "../ZinxPortfolio";
import { ticketDate } from "../lib/gallery-visit";

/** One print master is used by both the on-screen ticket and its PNG export. */
export function TicketArtwork({ works, date, svgRef, compact = false }: { works: Exhibit[]; date: string; svgRef: Ref<SVGSVGElement>; compact?: boolean }) {
  const id = "print-" + useId().replace(/[^a-z0-9_-]/gi, "");
  const fit = (work: Exhibit) => work.emblem?.treatment === "portrait" ? (work.emblem.focus === "top" ? "xMidYMin slice" : "xMidYMid slice") : "xMidYMid meet";
  if (compact) return <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" className="ticket-artwork" viewBox="0 0 800 1340" role="img" aria-label={"作品乐园参观票，" + works.map(work => work.title).join("、")}
    fontFamily="Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif">
    <defs>
      <mask id={id+"-mobile-edge"}><rect width="800" height="1340" rx="24" fill="white" /><circle cx="0" cy="1090" r="18" fill="black" /><circle cx="800" cy="1090" r="18" fill="black" /></mask>
      {[0,1,2].map(i => <clipPath key={i} id={`${id}-mobile-art-${i}`}><rect x="44" y={206+i*280} width="250" height="250" rx="6" /></clipPath>)}
    </defs>
    <g mask={`url(#${id}-mobile-edge)`}>
      <rect width="800" height="1340" fill="#211a24" /><rect y="1090" width="800" height="250" fill="#ede5d0" />
      <rect x="1" y="1" width="798" height="1338" rx="24" fill="none" stroke="#937b55" strokeWidth="2" />
      <text x="40" y="120" fill="#f0e9db" fontSize="104" fontWeight="800" letterSpacing="-6">ZINX</text>
      <text x="386" y="77" fill="#d5bf91" fontSize="25" letterSpacing="4">PLAY GALLERY</text>
      <text x="386" y="123" fill="#d7cbbc" fontSize="27" letterSpacing="3">作品乐园</text>
      {[0,1,2].map(index => {
        const work = works[index], y = 206 + index*280;
        return <g key={work?.id ?? index}>
          <rect x="44" y={y} width="250" height="250" rx="6" fill={work?.emblem?.treatment === "portrait" ? "#100f16" : "#39303d"} />
          {work?.emblem ? <image href={assetPath(work.emblem.src)} x="44" y={y} width="250" height="250" preserveAspectRatio={fit(work)} clipPath={`url(#${id}-mobile-art-${index})`} /> : <text x="169" y={y+148} fill="#bca981" textAnchor="middle" fontSize="58">＋</text>}
          <text x="344" y={y+57} fill="#bca981" fontSize="24" letterSpacing="2">{String(index+1).padStart(2,"0")}</text>
          <text x="344" y={y+127} fill="#f0e9db" fontSize={work && work.title.length > 10 ? "32" : "36"} fontWeight="600">{work?.title ?? "选择作品"}</text>
          <text x="344" y={y+175} fill="#b3a191" fontSize="25">{work?.status ?? ""}</text>
        </g>;
      })}
      <text x="44" y="1052" fill="#baa684" fontSize="21" letterSpacing="2">ZINX / COLLECTION</text>
      <path d="M22 1090h756" stroke="#9d8a69" strokeWidth="2" strokeDasharray="4 9" />
      <text x="42" y="1261" fill="#2e252d" fontSize="116" letterSpacing="-6">{String(works.length).padStart(2,"0")}</text>
      <text x="250" y="1197" fill="#29212b" fontSize="38" fontWeight="600">参观票</text>
      <text x="250" y="1250" fill="#716040" fontSize="24">{ticketDate(date)}</text>
      <text x="250" y="1295" fill="#897756" fontSize="18" letterSpacing="3">ADMISSION / {works.length} WORKS</text>
      <g transform="translate(610 1141)"><circle cx="72" cy="72" r="70" fill="none" stroke="#b8a37b" /><path d="M28 30h86v18l-62 50h62v18H28V96l61-48H28z" fill="#b39151" /></g>
    </g>
  </svg>;
  return <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" className="ticket-artwork" viewBox="0 0 1600 780" role="img" aria-label={"作品乐园参观票，" + works.map(work => work.title).join("、")}
    fontFamily="Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif">
    <defs>
      <linearGradient id={id + "-foil"} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fbefc9" /><stop offset=".45" stopColor="#ad8743" /><stop offset=".7" stopColor="#e6cca0" /><stop offset="1" stopColor="#9b7838" /></linearGradient>
      <mask id={id + "-edge"}><rect width="1600" height="780" rx="28" fill="white" /><circle cx="1240" cy="0" r="20" fill="black" /><circle cx="1240" cy="780" r="20" fill="black" /></mask>
      {[0,1,2].map(i => <clipPath id={`${id}-art-${i}`} key={i}><rect x={64+i*378} y="220" width="352" height="360" rx="5" /></clipPath>)}
    </defs>
    <g mask={`url(#${id}-edge)`}>
      <rect width="1600" height="780" fill="#211a24" />
      <rect x="1240" width="360" height="780" fill="#ede5d0" />
      <rect x="1" y="1" width="1598" height="778" rx="28" fill="none" stroke="#937b55" strokeWidth="2" />
      <path d="M1240 24v732" stroke="#9d8a69" strokeWidth="2" strokeDasharray="4 9" />
      <text x="60" y="146" fill="#f0e9db" fontSize="116" fontWeight="800" letterSpacing="-7">ZINX</text>
      <text x="415" y="100" fill="#d5bf91" fontSize="26" fontWeight="500" letterSpacing="5">PLAY</text>
      <text x="415" y="139" fill="#d5bf91" fontSize="26" fontWeight="500" letterSpacing="5">GALLERY</text>
      <text x="1176" y="100" fill="#d7cbbc" fontSize="19" textAnchor="end" letterSpacing="3">作品乐园</text>
      <text x="1176" y="138" fill="#aa9786" fontSize="18" textAnchor="end">{ticketDate(date)}</text>
      {[0,1,2].map(index => {
        const work = works[index], x = 64 + index * 378;
        const portrait = work?.emblem?.treatment === "portrait";
        return <g key={work?.id ?? index}>
          <text x={x} y="199" fill="#bca981" fontSize="17" letterSpacing="2">{String(index+1).padStart(2,"0")}</text>
          <rect x={x} y="220" width="352" height="360" rx="5" fill={portrait ? "#100f16" : "#39303d"} />
          {work?.emblem ? <image href={assetPath(work.emblem.src)} x={portrait ? x : x+18} y={portrait ? 220 : 238} width={portrait ? 352 : 316} height={portrait ? 360 : 324}
            preserveAspectRatio={fit(work)} clipPath={`url(#${id}-art-${index})`} />
            : <text x={x+176} y="418" textAnchor="middle" fill="#baa581" fontSize={work ? 46 : 70} fontWeight="500">{work?.title.slice(0,3) ?? "＋"}</text>}
          <text x={x} y="628" fill="#f0e9db" fontSize="29" fontWeight="600">{work?.title ?? "选择作品"}</text>
          <text x={x} y="661" fill="#b3a191" fontSize="20">{work?.status ?? ""}</text>
        </g>;
      })}
      <path d="M64 699h1112" stroke="#574836" strokeWidth="1" />
      <text x="64" y="743" fill="#baa684" fontSize="18" letterSpacing="3">ZINX / COLLECTION</text>
      <text x="1176" y="743" fill="#baa684" textAnchor="end" fontSize="18">{String(works.length).padStart(2,"0")} WORKS</text>
      <text x="1420" y="75" textAnchor="middle" fill="#716040" fontSize="16" letterSpacing="4">ADMISSION</text>
      <text x="1420" y="132" textAnchor="middle" fill="#29212b" fontSize="38" fontWeight="600">参观票</text>
      <g transform="translate(1318 224)">
        <circle cx="102" cy="102" r="99" fill="none" stroke="#b8a37b" strokeWidth="1" />
        <circle cx="102" cy="102" r="90" fill="none" stroke="#d0bc96" strokeWidth="1" />
        <path d="M46 46h112v24L79 138h79v22H46v-24l77-67H46z" fill={`url(#${id}-foil)`} stroke="#a68955" strokeWidth="1" />
      </g>
      <text x="1420" y="555" textAnchor="middle" fill="#2e252d" fontSize="116" fontWeight="500" letterSpacing="-6">{String(works.length).padStart(2,"0")}</text>
      <text x="1420" y="595" textAnchor="middle" fill="#716040" fontSize="22">件作品</text>
      <text x="1420" y="708" textAnchor="middle" fill="#55472f" fontSize="21" letterSpacing="2">{ticketDate(date)}</text>
      <text x="1420" y="745" textAnchor="middle" fill="#897756" fontSize="13" letterSpacing="3">ZINX PLAY GALLERY</text>
    </g>
  </svg>;
}
