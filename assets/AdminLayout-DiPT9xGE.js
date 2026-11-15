import{c as t,u as c,s as d}from"./index-DlEt-Cat.js";import{j as e}from"./vendor-markdown-R1PwYSYX.js";import{f as l,e as x,L as a}from"./vendor-react-BEQF0M5e.js";/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=t("CirclePlus",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M8 12h8",key:"1wcyev"}],["path",{d:"M12 8v8",key:"napkw2"}]]);/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=t("ExternalLink",[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]]);/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=t("FileText",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]]);/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=t("ListOrdered",[["path",{d:"M10 12h11",key:"6m4ad9"}],["path",{d:"M10 18h11",key:"11hvi2"}],["path",{d:"M10 6h11",key:"c7qv1k"}],["path",{d:"M4 10h2",key:"16xx2s"}],["path",{d:"M4 6h1v4",key:"cnovpq"}],["path",{d:"M6 18H4c0-1 2-2 2-3s-1-1.5-2-1",key:"m9a95d"}]]);/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=t("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=t("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=t("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]);function j({children:n}){const{user:s,logout:r}=c(),i=l(),h=x(),o=async()=>{await r(),h("/admin/login")};return e.jsxs("div",{className:"min-h-screen flex bg-[#F9FAFB] text-ink",children:[e.jsxs("aside",{className:"w-64 shrink-0 bg-[#15171A] text-white flex flex-col justify-between",children:[e.jsxs("div",{children:[e.jsx("div",{className:"px-6 py-6 border-b border-white/10",children:e.jsxs(a,{to:"/admin",className:"block",children:[e.jsx("span",{className:"font-masthead text-2xl text-white tracking-tight",children:d.title}),e.jsx("span",{className:"block font-condensed text-[11px] uppercase tracking-widest text-gray-400 mt-1",children:"Ghost Admin"})]})}),e.jsxs("nav",{className:"p-4 space-y-1",children:[e.jsxs(a,{to:"/admin",className:`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${i.pathname==="/admin"?"bg-white/10 text-white":"text-gray-300 hover:bg-white/5 hover:text-white"}`,children:[e.jsx(y,{className:"w-4 h-4"}),"Publicações"]}),e.jsxs(a,{to:"/admin/editor",className:`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${i.pathname.startsWith("/admin/editor")?"bg-white/10 text-white":"text-gray-300 hover:bg-white/5 hover:text-white"}`,children:[e.jsx(m,{className:"w-4 h-4"}),"Novo Artigo"]}),e.jsxs(a,{to:"/admin/menu",className:`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${i.pathname==="/admin/menu"?"bg-white/10 text-white":"text-gray-300 hover:bg-white/5 hover:text-white"}`,children:[e.jsx(k,{className:"w-4 h-4"}),"Menu"]}),e.jsxs("a",{href:"/",target:"_blank",rel:"noreferrer",className:"flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors",children:[e.jsx(p,{className:"w-4 h-4"}),"Ver Site"]})]})]}),e.jsxs("div",{className:"p-4 border-t border-white/10",children:[e.jsx("div",{className:"text-xs text-gray-400 truncate mb-3 px-2",children:s==null?void 0:s.email}),e.jsxs("button",{type:"button",onClick:o,className:"w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors",children:[e.jsx(u,{className:"w-4 h-4"}),"Sair"]})]})]}),e.jsx("main",{className:"flex-1 min-w-0",children:n})]})}export{j as A,f as P,b as T};
