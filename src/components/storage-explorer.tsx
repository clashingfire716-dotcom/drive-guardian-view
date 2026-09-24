import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Archive, ArrowDownWideNarrow, ArrowLeft, ArrowRight, Box, BrainCircuit, ChevronDown, ChevronRight, CircleGauge,
  Cloud, Code2, Copy, Database, Eye, File, FileArchive, FileCheck2, Folder, FolderOpen,
  HardDrive, History, Info, Layers3, ListFilter, Maximize2, Moon, PanelLeft, PanelRight,
  Pause, Play, Plus, RefreshCw, Search, ShieldCheck, Sun, Terminal, Trash2, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuTrigger } from "@/components/ui/context-menu";
import { diskRoot, findNode, findPath, flatten, formatSize, type Category, type DiskNode } from "@/lib/storage-data";
import { cn } from "@/lib/utils";

const categoryStyle: Record<Category, string> = {
  developer: "bg-developer text-developer-foreground", system: "bg-system text-system-foreground",
  media: "bg-media text-media-foreground", apps: "bg-apps text-apps-foreground",
  documents: "bg-documents text-documents-foreground", other: "bg-other text-other-foreground",
};
const categoryFill: Record<Category, string> = {
  developer: "var(--developer)", system: "var(--system)", media: "var(--media)", apps: "var(--apps)", documents: "var(--documents)", other: "var(--other)"
};
const categoryLabel: Record<Category, string> = { developer: "Developer", system: "System", media: "Media", apps: "Apps", documents: "Documents", other: "Other" };

type TreemapBox = { node: DiskNode; x: number; y: number; w: number; h: number };
function layoutTreemap(nodes: DiskNode[], x: number, y: number, w: number, h: number): TreemapBox[] {
  if (!nodes.length) return [];
  const total = nodes.reduce((sum, item) => sum + item.size, 0);
  if (total <= 0) return [];
  const items = [...nodes]
    .sort((a, b) => b.size - a.size)
    .map((node) => ({ node, area: (node.size / total) * w * h }));
  const boxes: TreemapBox[] = [];

  const worstRatio = (row: typeof items, side: number) => {
    const sum = row.reduce((value, item) => value + item.area, 0);
    const largest = Math.max(...row.map((item) => item.area));
    const smallest = Math.min(...row.map((item) => item.area));
    return Math.max((side * side * largest) / (sum * sum), (sum * sum) / (side * side * smallest));
  };
  const placeRow = (row: typeof items, rect: { x: number; y: number; w: number; h: number }) => {
    const area = row.reduce((value, item) => value + item.area, 0);
    if (rect.w >= rect.h) {
      const rowWidth = area / rect.h;
      let cursor = rect.y;
      row.forEach((item, index) => {
        const itemHeight = index === row.length - 1 ? rect.y + rect.h - cursor : item.area / rowWidth;
        boxes.push({ node: item.node, x: rect.x, y: cursor, w: rowWidth, h: itemHeight });
        cursor += itemHeight;
      });
      return { x: rect.x + rowWidth, y: rect.y, w: Math.max(0, rect.w - rowWidth), h: rect.h };
    }
    const rowHeight = area / rect.w;
    let cursor = rect.x;
    row.forEach((item, index) => {
      const itemWidth = index === row.length - 1 ? rect.x + rect.w - cursor : item.area / rowHeight;
      boxes.push({ node: item.node, x: cursor, y: rect.y, w: itemWidth, h: rowHeight });
      cursor += itemWidth;
    });
    return { x: rect.x, y: rect.y + rowHeight, w: rect.w, h: Math.max(0, rect.h - rowHeight) };
  };

  let remaining = items;
  let row: typeof items = [];
  let rect = { x, y, w, h };
  while (remaining.length) {
    const candidate = remaining[0];
    if (!candidate) break;
    const nextRow = [...row, candidate];
    const side = Math.max(0.001, Math.min(rect.w, rect.h));
    if (!row.length || worstRatio(nextRow, side) <= worstRatio(row, side)) {
      row = nextRow;
      remaining = remaining.slice(1);
    } else {
      rect = placeRow(row, rect);
      row = [];
    }
  }
  if (row.length) placeRow(row, rect);
  return boxes;
}

function TrafficLights() { return <div className="flex gap-2" aria-label="Window controls"><span className="traffic bg-close"/><span className="traffic bg-minimize"/><span className="traffic bg-zoom"/></div>; }
function IconButton({ label, children, active, onClick, disabled }: { label: string; children: React.ReactNode; active?: boolean; onClick?: () => void; disabled?: boolean }) {
  return <Button variant="ghost" size="icon" className={cn("h-8 w-8 text-muted-foreground hover:text-foreground", active && "bg-accent text-foreground")} aria-label={label} title={label} onClick={onClick} disabled={disabled}>{children}</Button>;
}

function SourceIcon({ type }: { type: "disk" | "external" | "cloud" }) { const Icon = type === "cloud" ? Cloud : type === "external" ? Database : HardDrive; return <Icon className="size-[17px]"/>; }

function Sidebar({ collapsed, currentLens, setLens, onScan }: { collapsed: boolean; currentLens: string; setLens: (id: string) => void; onScan: () => void }) {
  const lenses = [
    ["large", "Large Files", "> 1 GB", CircleGauge], ["dormant", "Dormant Files", "> 180 days", Moon],
    ["developer", "Developer Artifacts", "79.3 GB", Code2], ["archives", "Installers & Archives", "36.3 GB", Archive],
    ["leftovers", "Application Leftovers", "8.7 GB", Box],
  ] as const;
  if (collapsed) return null;
  return <aside className="sidebar-material flex min-h-0 w-[224px] shrink-0 flex-col border-r border-border/70 px-3 pb-3 pt-2">
    <p className="section-label">Storage</p>
    <button className="source-row source-row-active" onClick={() => setLens("all")}>
      <span className="drive-icon"><SourceIcon type="disk"/></span><span className="min-w-0 flex-1 text-left"><b>Macintosh HD</b><small>642 GB of 994 GB</small></span>
    </button>
    <div className="storage-meter mx-2 mb-3"><span style={{ width: "64.6%" }}/></div>
    <button className="source-row"><span className="drive-icon"><SourceIcon type="external"/></span><span className="min-w-0 flex-1 text-left"><b>External Drives</b><small>Samsung T7</small></span><ChevronRight className="size-3.5 opacity-45"/></button>
    <button className="source-row"><span className="drive-icon"><SourceIcon type="cloud"/></span><span className="min-w-0 flex-1 text-left"><b>iCloud Drive</b><small>126 GB used</small></span></button>
    <p className="section-label mt-5">Smart Lenses</p>
    <div className="space-y-0.5">
      {lenses.map(([id, label, detail, Icon]) => <button key={id} className={cn("lens-row", currentLens === id && "lens-row-active")} onClick={() => setLens(id)}><Icon className="size-[17px]"/><span className="flex-1 truncate text-left">{label}</span><small>{detail}</small></button>)}
    </div>
    <div className="mt-auto pt-4"><Button variant="outline" className="h-9 w-full justify-start bg-background/30 text-[13px]" onClick={onScan}><Plus/>Scan Folder…</Button></div>
  </aside>;
}

function SearchBox({ query, setQuery }: { query: string; setQuery: (s: string) => void }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  return <div className="relative min-w-[210px] max-w-[330px] flex-1">
    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>
    <input id="pro-search" aria-label="Search disk" className="h-8 w-full rounded-md border border-input bg-background/55 pl-8 pr-16 text-[13px] outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search disk"/>
    <button className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground" title="Filters" aria-label="Search filters" onClick={() => setFiltersOpen(!filtersOpen)}><ListFilter className="size-4"/></button>
    <kbd className="absolute right-2 top-1/2 -translate-y-1/2">⌘K</kbd>
    {filtersOpen && <div className="popover-panel absolute right-0 top-10 z-40 w-72 p-4"><h3 className="mb-3 text-sm font-semibold">Search Filters</h3><label className="filter-label">Minimum size <span>1 GB</span></label><input type="range" min="0" max="100" defaultValue="25" className="w-full accent-primary"/><div className="mt-4 flex items-center justify-between text-sm"><span>Dormant over 180 days</span><Switch/></div><div className="mt-3 flex items-center justify-between text-sm"><span>Safe to delete only</span><Switch defaultChecked/></div></div>}
  </div>;
}

function Toolbar({ sidebar, setSidebar, inspector, setInspector, view, setView, query, setQuery, paused, setPaused, collectorCount, collectorSize, onCollector, dark, setDark, onUtility, onFocus }: any) {
  const [volume, setVolume] = useState("mac");
  return <header className="toolbar-material relative z-30 flex h-[70px] shrink-0 items-center gap-3 border-b border-border/70 px-4">
    <TrafficLights/><div className="mx-1 h-7 w-px bg-border/60"/><IconButton label="Toggle sidebar" active={!sidebar} onClick={() => setSidebar(!sidebar)}><PanelLeft/></IconButton>
    <div className="relative"><select aria-label="Storage volume" value={volume} onChange={(e) => setVolume(e.target.value)} className="h-9 appearance-none rounded-md border border-input bg-background/45 py-1 pl-9 pr-8 text-[13px] font-semibold outline-none"><option value="mac">Macintosh HD</option><option value="t7">Samsung T7 2TB</option><option value="custom">Scan Custom Folder…</option></select><HardDrive className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground"/><ChevronDown className="pointer-events-none absolute right-2 top-2.5 size-4 text-muted-foreground"/></div>
    <div className="hidden min-w-[145px] xl:block"><div className="flex items-center gap-1.5 text-[12px] font-medium"><span className={cn("status-dot", paused && "bg-muted-foreground")}/>{paused ? "Scan paused" : "Scanning Macintosh HD"}</div><div className="mono mt-0.5 text-[10px] text-muted-foreground">85,420 files/sec · 3.2s elapsed</div></div>
    <IconButton label={paused ? "Resume scan" : "Pause scan"} onClick={() => setPaused(!paused)}>{paused ? <Play/> : <Pause/>}</IconButton><IconButton label="Rescan"><RefreshCw/></IconButton>
    <div className="toolbar-tools"><IconButton label="Show hidden space" onClick={() => onUtility("Hidden and purgeable APFS space is now visible")}><Eye/></IconButton><IconButton label="APFS snapshot history" onClick={() => onUtility("3 local APFS snapshots · 18.6 GB reclaimable")}><History/></IconButton><IconButton label="Sort largest first" onClick={() => onUtility("Items sorted by allocated size")}><ArrowDownWideNarrow/></IconButton><IconButton label="Focus visualization" onClick={onFocus}><Maximize2/></IconButton></div>
    <div className="segmented ml-auto"><button className={view === "treemap" ? "selected" : ""} onClick={() => setView("treemap")}><Layers3/>TreeMap <kbd>⌘1</kbd></button><button className={view === "sunmap" ? "selected" : ""} onClick={() => setView("sunmap")}><CircleGauge/>SunMap <kbd>⌘2</kbd></button></div>
    <SearchBox query={query} setQuery={setQuery}/>
    <Button variant="outline" className="h-8 bg-background/45 px-2.5 text-xs" onClick={onCollector}><Archive/><span className="hidden 2xl:inline">{collectorCount ? `${collectorCount} items · ${formatSize(collectorSize)}` : "Collector"}</span>{collectorCount > 0 && <span className="counter-badge">{collectorCount}</span>}</Button>
    <span className="pro-pill"><ShieldCheck/>PRO</span><IconButton label="Toggle appearance" onClick={() => setDark(!dark)}>{dark ? <Moon/> : <Sun/>}</IconButton><IconButton label="Toggle inspector" active={!inspector} onClick={() => setInspector(!inspector)}><PanelRight/></IconButton>
  </header>;
}

function Breadcrumbs({ path, onNavigate, canBack, canForward, onBack, onForward, onUp }: any) {
  return <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border/70 px-3"><IconButton label="Back" disabled={!canBack} onClick={onBack}><ArrowLeft/></IconButton><IconButton label="Forward" disabled={!canForward} onClick={onForward}><ArrowRight/></IconButton><IconButton label="Up one level" disabled={path.length <= 1} onClick={onUp}><ChevronDown className="rotate-180"/></IconButton><div className="ml-2 flex min-w-0 items-center overflow-hidden text-[13px]">{path.map((item: DiskNode, i: number) => <span key={item.id} className="flex shrink-0 items-center"><button onClick={() => onNavigate(item.id)} className={cn("rounded px-1.5 py-1 text-muted-foreground hover:bg-accent hover:text-foreground", i === path.length - 1 && "font-semibold text-foreground")}>{item.name}</button>{i < path.length - 1 && <ChevronRight className="size-3.5 text-muted-foreground/50"/>}</span>)}</div></div>;
}

function NodeMenu({ node, children, onSelect, onDrill, onQuickLook, onStage }: any) {
  return <ContextMenu><ContextMenuTrigger asChild>{children}</ContextMenuTrigger><ContextMenuContent className="w-60"><ContextMenuItem onSelect={() => onSelect(node)}><FolderOpen className="mr-2 size-4"/>Reveal in Finder</ContextMenuItem><ContextMenuItem onSelect={() => onQuickLook(node)}><Eye className="mr-2 size-4"/>Quick Look<ContextMenuShortcut>Space</ContextMenuShortcut></ContextMenuItem><ContextMenuItem onSelect={() => navigator.clipboard?.writeText(`/Volumes/Macintosh HD/${node.name}`)}><Copy className="mr-2 size-4"/>Copy Path</ContextMenuItem><ContextMenuSeparator/><ContextMenuItem disabled={node.protected} onSelect={() => onStage(node)}><Archive className="mr-2 size-4"/>Add to Collector</ContextMenuItem><ContextMenuItem><Terminal className="mr-2 size-4"/>Open in Terminal</ContextMenuItem><ContextMenuItem><BrainCircuit className="mr-2 size-4"/>Ask Disk Advisor</ContextMenuItem>{node.type === "folder" && <ContextMenuItem onSelect={() => onDrill(node)}><Search className="mr-2 size-4"/>Scan Folder Only</ContextMenuItem>}<ContextMenuSeparator/><ContextMenuItem disabled={node.protected} className="text-destructive" onSelect={() => onStage(node)}><Trash2 className="mr-2 size-4"/>Move to Trash<ContextMenuShortcut>⌘⌫</ContextMenuShortcut></ContextMenuItem></ContextMenuContent></ContextMenu>;
}

function TreemapTile({ box, selected, onSelect, onDrill, onQuickLook, onStage, depth = 0 }: { box: TreemapBox; selected: DiskNode; onSelect: (node: DiskNode) => void; onDrill: (node: DiskNode) => void; onQuickLook: (node: DiskNode) => void; onStage: (node: DiskNode) => void; depth?: number }) {
  const childBoxes = box.node.children?.length && depth < 2 && box.w > 9 && box.h > 9 ? layoutTreemap(box.node.children, 0, 0, 100, 100) : [];
  const isFolder = box.node.type === "folder";
  return <NodeMenu node={box.node} onSelect={onSelect} onDrill={onDrill} onQuickLook={onQuickLook} onStage={onStage}><div
    role="button" tabIndex={0} aria-label={`${box.node.name}, ${formatSize(box.node.size)}`}
    className={cn("treemap-node group absolute overflow-hidden transition-[filter,transform] hover:z-10 hover:brightness-110 focus:z-20 focus:outline-none focus:ring-2 focus:ring-ring", categoryStyle[box.node.category], selected?.id === box.node.id && "z-20 ring-2 ring-selection ring-inset", depth > 0 && "nested-node", isFolder ? "folder-node" : "file-node")}
    style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }}
    onClick={(event) => { event.stopPropagation(); onSelect(box.node); }} onDoubleClick={(event) => { event.stopPropagation(); onDrill(box.node); }} onKeyDown={(event) => { if (event.key === "Enter") onDrill(box.node); }}>
    <span className="node-shine"/><span className={cn("node-label", depth > 0 && "compact")}><span className="node-icon">{isFolder?<Folder/>:<File/>}</span><b>{box.node.name}</b><small className="mono">{formatSize(box.node.size)}</small></span>
    {childBoxes.length > 0 && <div className="treemap-children">{childBoxes.map((childBox) => <TreemapTile key={childBox.node.id} box={childBox} selected={selected} onSelect={onSelect} onDrill={onDrill} onQuickLook={onQuickLook} onStage={onStage} depth={depth + 1}/>)}</div>}
    <span className="node-tooltip"><b>{box.node.name}</b><span>{formatSize(box.node.size)} · {categoryLabel[box.node.category]}</span></span>
  </div></NodeMenu>;
}

function Treemap({ current, selected, onSelect, onDrill, onQuickLook, onStage }: any) {
  const nodes = current.children?.length ? current.children : [current];
  const boxes = layoutTreemap(nodes, 0, 0, 100, 100);
  return <div className="relative h-full w-full overflow-hidden bg-canvas p-2"><div className="relative h-full w-full overflow-hidden rounded-md bg-canvas-inner shadow-inner">
    {boxes.map((box) => <TreemapTile key={box.node.id} box={box} selected={selected} onSelect={onSelect} onDrill={onDrill} onQuickLook={onQuickLook} onStage={onStage}/>)}
  </div></div>;
}

function polar(cx: number, cy: number, r: number, angle: number) { const rad = (angle - 90) * Math.PI / 180; return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]; }
function arcPath(start: number, end: number, inner: number, outer: number) { const [a,b]=polar(50,50,outer,start), [c,d]=polar(50,50,outer,end), [e,f]=polar(50,50,inner,end), [g,h]=polar(50,50,inner,start); return `M ${a} ${b} A ${outer} ${outer} 0 ${end-start>180?1:0} 1 ${c} ${d} L ${e} ${f} A ${inner} ${inner} 0 ${end-start>180?1:0} 0 ${g} ${h} Z`; }
function SunMap({ current, selected, onSelect, onDrill, onQuickLook, onStage, onUp }: any) {
  const [hovered, setHovered] = useState<DiskNode | null>(null); const nodes = current.children ?? [];
  let angle = 0; const total = nodes.reduce((s: number,n: DiskNode)=>s+n.size,0);
  const arcs = nodes.map((n: DiskNode) => { const start=angle; const end=angle+(n.size/total)*359.4; angle=end+.6; return {n,start,end}; });
  return <div className="relative flex h-full items-center justify-center overflow-hidden bg-canvas"><svg viewBox="0 0 100 100" className="h-[92%] max-h-[720px] w-[92%] max-w-[720px] drop-shadow-2xl" role="img" aria-label={`SunMap of ${current.name}`}>
    {arcs.map(({n,start,end}) => <g key={n.id} onMouseEnter={()=>setHovered(n)} onMouseLeave={()=>setHovered(null)} onClick={()=>onSelect(n)} onDoubleClick={()=>onDrill(n)} className="cursor-pointer"><path d={arcPath(start,end,15,30)} fill={categoryFill[n.category]} stroke="var(--canvas)" strokeWidth=".6" className={cn("transition-all hover:brightness-125", selected?.id===n.id && "sun-selected")}/>{(n.children??[]).map((child: DiskNode, i: number, arr: DiskNode[]) => { const childStart=start+(end-start)*i/arr.length; const childEnd=start+(end-start)*(i+1)/arr.length-.4; return <path key={child.id} d={arcPath(childStart,childEnd,31,45)} fill={categoryFill[child.category]} opacity=".78" stroke="var(--canvas)" strokeWidth=".5" onClick={(e)=>{e.stopPropagation();onSelect(child)}} onDoubleClick={(e)=>{e.stopPropagation();onDrill(child)}}/>; })}</g>)}
    <circle cx="50" cy="50" r="13.6" fill="var(--canvas-inner)" stroke="var(--border)" strokeWidth=".7" onClick={onUp} className="cursor-pointer"/><text x="50" y="48.6" textAnchor="middle" fill="var(--foreground)" fontSize="3.3" fontWeight="700">{current.name.length>16?current.name.slice(0,14)+"…":current.name}</text><text x="50" y="53" textAnchor="middle" fill="var(--muted-foreground)" fontSize="2.5">{formatSize(current.size)}</text>
  </svg>{hovered && <div className="sun-hud"><span className={cn("category-dot", categoryStyle[hovered.category])}/><div><b>{hovered.name}</b><small className="mono">{formatSize(hovered.size)} · {Math.round(hovered.size/current.size*100)}% of parent</small></div></div>}</div>;
}

function Inspector({ node, onStage }: { node: DiskNode; onStage: (node: DiskNode) => void }) {
  const [messages, setMessages] = useState([{ by: "advisor", text: "I found 31.4 GB of regenerable cache data in this area. Your documents and active projects are unaffected." }]);
  const [input,setInput]=useState("");
  const send=(text:string)=>{if(!text.trim())return; setMessages(m=>[...m,{by:"user",text},{by:"advisor",text:node.protected?"This item is protected by System Integrity Protection and should remain unchanged.":node.safe?"This data is safe to remove. The associated app may rebuild it when next opened.":"Review this item before removal. I can explain its contents, but it may include user-created data."}]);setInput("")};
  const breakdown = (node.children ?? []).slice(0,5);
  return <aside className="inspector-material min-h-0 w-[292px] shrink-0 border-l border-border/70"><Tabs defaultValue="info" className="flex h-full flex-col"><div className="border-b border-border/70 p-2"><TabsList className="grid h-8 w-full grid-cols-2"><TabsTrigger value="info" className="text-xs"><Info/>Info</TabsTrigger><TabsTrigger value="advisor" className="text-xs"><BrainCircuit/>Disk Advisor</TabsTrigger></TabsList></div>
    <TabsContent value="info" className="m-0 min-h-0 flex-1 overflow-y-auto p-4"><div className="flex items-start gap-3"><div className={cn("rounded-lg p-3 shadow-inner",categoryStyle[node.category])}>{node.type==="folder"?<Folder className="size-7"/>:<File className="size-7"/>}</div><div className="min-w-0"><h2 className="truncate text-[17px] font-semibold">{node.name}</h2><p className="mt-0.5 text-xs text-muted-foreground">{categoryLabel[node.category]} · {node.type}</p>{node.protected?<span className="status-badge critical"><ShieldCheck/>SIP Protected</span>:node.safe?<span className="status-badge safe"><FileCheck2/>Safe to Purge</span>:<span className="status-badge review">Review Recommended</span>}</div></div>
      <InspectorSection title="Storage"><DataRow label="Logical size" value={formatSize(node.size)}/><DataRow label="On disk" value={formatSize(node.size*.92)}/><DataRow label="APFS savings" value={formatSize(node.size*.08)}/><DataRow label="Purgeable" value={node.safe?formatSize(node.size*.88):"—"}/></InspectorSection>
      <InspectorSection title="Contents"><DataRow label="Files" value={(Math.round(node.size/8_200_000)).toLocaleString()}/><DataRow label="Folders" value={(node.children?.length??0).toLocaleString()}/>{breakdown.length>0&&<div className="mt-3 flex h-2 overflow-hidden rounded-full">{breakdown.map(c=><span key={c.id} className={categoryStyle[c.category]} style={{width:`${c.size/node.size*100}%`}}/>)}</div>}</InspectorSection>
      <InspectorSection title="Dates"><DataRow label="Created" value="Mar 14, 2023"/><DataRow label="Modified" value={node.modified}/><DataRow label="Last opened" value={node.accessed}/></InspectorSection>
      <InspectorSection title="Permissions"><DataRow label="Mode" value="drwxr-xr-x" mono/><DataRow label="Owner" value="alex:staff" mono/><DataRow label="Protection" value={node.protected?"SIP enabled":"Standard"}/></InspectorSection>
    </TabsContent>
    <TabsContent value="advisor" className="m-0 flex min-h-0 flex-1 flex-col"><div className="border-b border-border/70 p-4"><div className="mb-2 flex items-center gap-2 text-sm font-semibold"><BrainCircuit className="size-4 text-advisor"/>Space diagnostic</div><p className="text-[12px] leading-5 text-muted-foreground">{node.safe?`${node.name} expanded after recent builds and app activity. Most content is derived and can be recreated automatically.`:node.protected?"This folder contains core operating system resources protected from modification.":"This area contains a mix of user-created and application-managed data. Review individual items before cleanup."}</p>{node.safe&&!node.protected&&<Button className="mt-3 h-8 w-full text-xs" onClick={()=>onStage(node)}><Archive/>Stage recommended caches</Button>}</div>
      <div className="flex min-h-0 flex-1 flex-col p-3"><div className="min-h-0 flex-1 space-y-2 overflow-y-auto">{messages.map((m,i)=><div key={i} className={cn("chat-bubble",m.by==="user"&&"user")}>{m.text}</div>)}</div><div className="my-2 flex gap-1.5 overflow-x-auto pb-1">{["What is safe to delete here?","Find duplicates","Explain purpose"].map(p=><button key={p} onClick={()=>send(p)} className="prompt-chip">{p}</button>)}</div><form onSubmit={e=>{e.preventDefault();send(input)}} className="flex gap-1.5"><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask about this item" className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background/60 px-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"/><IconButton label="Send"><ArrowRight/></IconButton></form></div>
    </TabsContent></Tabs></aside>;
}
function InspectorSection({title,children}:{title:string;children:React.ReactNode}) { return <section className="mt-6"><h3 className="section-label mb-2 px-0">{title}</h3><div className="space-y-2.5">{children}</div></section>; }
function DataRow({label,value,mono}:{label:string;value:string;mono?:boolean}) { return <div className="flex justify-between gap-4 text-[12px]"><span className="text-muted-foreground">{label}</span><span className={cn("text-right font-medium",mono&&"mono")}>{value}</span></div>; }

function Collector({ open, items, onRemove, onReview, onClose }: any) {
  const total=items.reduce((s:number,n:DiskNode)=>s+n.size,0);
  return <AnimatePresence>{open&&<motion.section initial={{height:0}} animate={{height:188}} exit={{height:0}} transition={{duration:.22,ease:"easeOut"}} className="collector-material shrink-0 overflow-hidden border-t border-border"><div className="flex h-12 items-center border-b border-border/70 px-4"><Archive className="mr-2 size-4 text-primary"/><b className="text-sm">Collector</b><span className="ml-2 text-xs text-muted-foreground">Staged for cleanup</span><span className="mono ml-auto mr-3 text-sm font-semibold">{formatSize(total)} reclaimable</span><IconButton label="Close collector" onClick={onClose}><X/></IconButton></div><div className="flex h-[136px] items-stretch"><div className="flex min-w-0 flex-1 gap-2 overflow-x-auto p-3">{items.length?items.map((n:DiskNode)=><div key={n.id} className="collector-item"><div className={cn("rounded p-1.5",categoryStyle[n.category])}><Folder className="size-4"/></div><div className="min-w-0 flex-1"><b className="block truncate text-xs">{n.name}</b><span className="mono text-[10px] text-muted-foreground">{formatSize(n.size)}</span></div><IconButton label={`Remove ${n.name}`} onClick={()=>onRemove(n.id)}><X/></IconButton></div>):<div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Add safe items from the map or inspector.</div>}</div><div className="flex w-56 flex-col justify-center border-l border-border/70 p-4"><Button disabled={!items.length} onClick={onReview}><ShieldCheck/>Review & Purge</Button><span className="mt-2 text-center text-[10px] text-muted-foreground">Nothing is removed until you confirm.</span></div></div></motion.section>}</AnimatePresence>;
}

function QuickLook({ node, open, setOpen, onStage }: { node: DiskNode | null; open: boolean; setOpen: (open: boolean) => void; onStage: (node: DiskNode) => void }) { return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="quick-look max-w-2xl overflow-hidden p-0"><div className="flex h-11 items-center justify-center border-b border-border/70 text-sm font-semibold">Quick Look — {node?.name}</div>{node&&<div className="grid grid-cols-[1fr_220px]"><div className="flex min-h-72 items-center justify-center bg-canvas"><div className={cn("rounded-xl p-10 shadow-2xl",categoryStyle[node.category])}>{node.type==="folder"?<Folder className="size-20"/>:<FileArchive className="size-20"/>}</div></div><div className="p-5"><h2 className="break-words text-lg font-semibold">{node.name}</h2><p className="mono mt-1 text-xs text-muted-foreground">{formatSize(node.size)}</p><div className="mt-6 space-y-3"><DataRow label="Kind" value={node.type==="folder"?"Folder":"Document"}/><DataRow label="Category" value={categoryLabel[node.category]}/><DataRow label="Modified" value="Sep 18, 2026"/></div><Button className="mt-8 w-full" disabled={node.protected} onClick={()=>{onStage(node);setOpen(false)}}><Archive/>Add to Collector</Button></div></div>}</DialogContent></Dialog>; }

function PurgeSheet({ open, setOpen, items, onPurge }: any) {
  const [mode,setMode]=useState<"trash"|"purge">("trash"),[snapshot,setSnapshot]=useState(true),[authorizing,setAuthorizing]=useState(false);
  const total=items.reduce((s:number,n:DiskNode)=>s+n.size,0);
  const authorize=()=>{setAuthorizing(true);setTimeout(()=>{onPurge();setAuthorizing(false);setOpen(false)},1600)};
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-md"><DialogHeader className="text-center sm:text-center"><div className="mx-auto mb-2 rounded-full bg-safe/15 p-3 text-safe"><ShieldCheck className="size-7"/></div><DialogTitle>Review cleanup</DialogTitle><DialogDescription>{items.length} items will reclaim {formatSize(total)} on Macintosh HD.</DialogDescription></DialogHeader><div className="segmented mx-auto mt-2"><button className={mode==="trash"?"selected":""} onClick={()=>setMode("trash")}>Move to Trash</button><button className={mode==="purge"?"selected":""} onClick={()=>setMode("purge")}>Direct Purge</button></div><div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2">{items.map((n:DiskNode)=><div key={n.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-xs"><Folder className="size-4 text-muted-foreground"/><span className="min-w-0 flex-1 truncate">{n.name}</span><span className="mono text-muted-foreground">{formatSize(n.size)}</span></div>)}</div><label className="flex items-center justify-between rounded-md border border-border bg-muted/40 p-3 text-sm"><span><b className="block">Create APFS snapshot</b><small className="text-muted-foreground">Rollback checkpoint before cleanup</small></span><Switch checked={snapshot} onCheckedChange={setSnapshot}/></label><DialogFooter><Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button><Button onClick={authorize} disabled={authorizing}>{authorizing?<><span className="touch-pulse"/>Authorizing…</>:<><ShieldCheck/>{mode==="trash"?"Authorize & Move":"Authorize & Purge"}</>}</Button></DialogFooter></DialogContent></Dialog>;
}

export function StorageExplorer() {
  const [dark,setDark]=useState(true),[sidebar,setSidebar]=useState(true),[inspector,setInspector]=useState(true),[view,setView]=useState<"treemap"|"sunmap">("treemap"),[paused,setPaused]=useState(false),[lens,setLens]=useState("all"),[query,setQuery]=useState(""),[currentId,setCurrentId]=useState("root"),[selected,setSelected]=useState<DiskNode>(diskRoot.children?.[0]??diskRoot),[history,setHistory]=useState(["root"]),[historyIndex,setHistoryIndex]=useState(0),[collector,setCollector]=useState<DiskNode[]>([]),[collectorOpen,setCollectorOpen]=useState(false),[quickOpen,setQuickOpen]=useState(false),[quickNode,setQuickNode]=useState<DiskNode|null>(null),[purgeOpen,setPurgeOpen]=useState(false),[reclaimed,setReclaimed]=useState(0),[toast,setToast]=useState("");
  const current=findNode(diskRoot,currentId)??diskRoot; const path=findPath(diskRoot,currentId)??[diskRoot];
  const visibleCurrent=useMemo(()=>{ if(!query.trim()&&lens==="all") return current; const q=query.toLowerCase(); let nodes=flatten(diskRoot).filter(n=>n.id!=="root"); if(q){nodes=nodes.filter(n=>{const hay=`${n.name} ${categoryLabel[n.category]} ${n.safe?"safe delete cache":""}`.toLowerCase();return q.split(" ").every(word=>hay.includes(word)||((word.includes("large")||word.includes("1gb"))&&n.size>1e9)||((word.includes("developer")||word.includes("xcode"))&&n.category==="developer")||((word.includes("4k")||word.includes("video"))&&n.category==="media"));});} if(lens==="large")nodes=nodes.filter(n=>n.size>1e9); if(lens==="developer")nodes=nodes.filter(n=>n.category==="developer"); if(lens==="archives")nodes=nodes.filter(n=>/archive|dmg|installer|zip/i.test(n.name)); if(lens==="dormant")nodes=nodes.filter(n=>n.safe); if(lens==="leftovers")nodes=nodes.filter(n=>n.safe&&n.category==="apps"); return {...current,name:q?`Search: ${query}`:current.name,size:nodes.reduce((s,n)=>s+n.size,0),children:nodes.slice(0,14)};},[current,query,lens]);
  const navigate=useCallback((id:string)=>{setCurrentId(id);setQuery("");setLens("all");setHistory(h=>[...h.slice(0,historyIndex+1),id]);setHistoryIndex(i=>i+1)},[historyIndex]);
  const drill=(node:DiskNode)=>{setSelected(node);if(node.type==="folder"&&node.children?.length)navigate(node.id);else{setQuickNode(node);setQuickOpen(true)}};
  const stage=(node:DiskNode)=>{if(node.protected){setToast("Protected items cannot be added to cleanup.");return;}setCollector(items=>items.some(n=>n.id===node.id)?items:[...items,node]);setCollectorOpen(true);setToast(`${node.name} added to Collector`)};
  useEffect(()=>{document.documentElement.classList.toggle("dark",dark)},[dark]);
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key==="1"){e.preventDefault();setView("treemap")}if((e.metaKey||e.ctrlKey)&&e.key==="2"){e.preventDefault();setView("sunmap")}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();(document.querySelector("#pro-search") as HTMLInputElement)?.focus()}if(e.altKey&&e.metaKey&&e.key.toLowerCase()==="i"){e.preventDefault();setInspector(v=>!v)}if(e.code==="Space"&&document.activeElement?.tagName!=="INPUT"){e.preventDefault();setQuickNode(selected);setQuickOpen(true)}if(e.metaKey&&e.key==="Backspace"){e.preventDefault();stage(selected)}};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[selected]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(""),2200);return()=>clearTimeout(t)},[toast]);
  const goHistory=(delta:number)=>{const next=historyIndex+delta;const nextId=history[next];if(next>=0&&next<history.length&&nextId){setHistoryIndex(next);setCurrentId(nextId)}};
  const parentNode=path.length>1?path[path.length-2]:undefined;
  const totalCollector=collector.reduce((s,n)=>s+n.size,0);
  return <main className="app-desktop"><section className="mac-window">
    <Toolbar sidebar={sidebar} setSidebar={setSidebar} inspector={inspector} setInspector={setInspector} view={view} setView={setView} query={query} setQuery={setQuery} paused={paused} setPaused={setPaused} collectorCount={collector.length} collectorSize={totalCollector} onCollector={()=>setCollectorOpen(v=>!v)} dark={dark} setDark={setDark} onUtility={setToast} onFocus={()=>{setSidebar(false);setInspector(false);setCollectorOpen(false)}}/>
    <div className="flex min-h-0 flex-1"><Sidebar collapsed={!sidebar} currentLens={lens} setLens={setLens} onScan={()=>setToast("Folder picker opened — demo mode")}/><section className="flex min-w-0 flex-1 flex-col"><Breadcrumbs path={path} onNavigate={navigate} canBack={historyIndex>0} canForward={historyIndex<history.length-1} onBack={()=>goHistory(-1)} onForward={()=>goHistory(1)} onUp={()=>parentNode&&navigate(parentNode.id)}/><div className="relative min-h-0 flex-1">{view==="treemap"?<Treemap current={visibleCurrent} selected={selected} onSelect={setSelected} onDrill={drill} onQuickLook={(n:DiskNode)=>{setQuickNode(n);setQuickOpen(true)}} onStage={stage}/>:<SunMap current={visibleCurrent} selected={selected} onSelect={setSelected} onDrill={drill} onQuickLook={()=>{}} onStage={stage} onUp={()=>parentNode&&navigate(parentNode.id)}/>}<div className="legend">{Object.entries(categoryLabel).map(([key,label])=><span key={key}><i className={categoryStyle[key as Category]}/>{label}</span>)}</div>{query&&<div className="result-count">{visibleCurrent.children?.length??0} matches</div>}</div></section>{inspector&&<Inspector node={selected} onStage={stage}/>}</div>
    <Collector open={collectorOpen} items={collector} onRemove={(id:string)=>setCollector(c=>c.filter(n=>n.id!==id))} onReview={()=>setPurgeOpen(true)} onClose={()=>setCollectorOpen(false)}/>
    <footer className="status-bar"><span><span className="status-dot"/>Scan complete</span><span className="mono">642 GB used · {formatSize(352e9+reclaimed)} available</span><span>1,847,392 items indexed</span></footer>
  </section><QuickLook node={quickNode} open={quickOpen} setOpen={setQuickOpen} onStage={stage}/><PurgeSheet open={purgeOpen} setOpen={setPurgeOpen} items={collector} onPurge={()=>{setReclaimed(r=>r+totalCollector);setToast(`${formatSize(totalCollector)} reclaimed successfully`);setCollector([]);setCollectorOpen(false)}}/>{toast&&<div className="toast"><FileCheck2/>{toast}</div>}</main>;
}
