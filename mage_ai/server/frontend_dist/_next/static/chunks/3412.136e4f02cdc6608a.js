(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[3412],{47365:function(n,e,t){"use strict";t.r(e),t.d(e,{default:function(){return k}});var r=t(77837),o=t(82394),i=t(38860),c=t.n(i),u=t(82684),a=t(9518),l=t(51774),s=t.n(l),d=t(78050),p=t(79967),f=t(66878),h=t(11611),b=t(22306),m=t(87118),v=t(27563),_=t(42122),w=t(28189);function g(n,e){var t=Object.keys(n);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(n);e&&(r=r.filter((function(e){return Object.getOwnPropertyDescriptor(n,e).enumerable}))),t.push.apply(t,r)}return t}function y(n){for(var e=1;e<arguments.length;e++){var t=null!=arguments[e]?arguments[e]:{};e%2?g(Object(t),!0).forEach((function(e){(0,o.Z)(n,e,t[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(n,Object.getOwnPropertyDescriptors(t)):g(Object(t)).forEach((function(e){Object.defineProperty(n,e,Object.getOwnPropertyDescriptor(t,e))}))}return n}function x(n){return(0,_.Ee)({subtype:w.dS.IDE,type:w.KU.EDITOR,uuid:(null==n?void 0:n.uuid)||"/home/src/default_repo/mlops/mlops/memory_upgrade_v2/transformers/artistic_portal.py"},n)}function O(n){return(0,_.Ee)(y(y({},n),{},{subtype:w.dS.SYSTEM,type:w.KU.BROWSER,uuid:w.Cm.FILE_BROWSER}),n)}function j(n){return(0,_.Ee)({apps:[O,x],layout:{column:-1},uuid:w.xc.DEFAULT},n)}var z=t(28862),I=t(10658),T=t(70933),E=t.n(T),P=t(28598);function D(n,e){var t=Object.keys(n);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(n);e&&(r=r.filter((function(e){return Object.getOwnPropertyDescriptor(n,e).enumerable}))),t.push.apply(t,r)}return t}function R(n){for(var e=1;e<arguments.length;e++){var t=null!=arguments[e]?arguments[e]:{};e%2?D(Object(t),!0).forEach((function(e){(0,o.Z)(n,e,t[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(n,Object.getOwnPropertyDescriptors(t)):D(Object(t)).forEach((function(e){Object.defineProperty(n,e,Object.getOwnPropertyDescriptor(t,e))}))}return n}var k=function(){var n=(0,u.useRef)(0),e=(0,u.useContext)(a.ThemeContext),i=(0,u.useRef)(null),l=(0,u.useRef)({}),_=(0,u.useRef)({}),w=(0,u.useState)(!1),g=w[0],y=w[1];function x(){if(null!=i&&i.current){var n,e=(null===(n=Object.keys((null==l?void 0:l.current)||{}))||void 0===n?void 0:n.length)||1,t=/(template-columns-\d+)/;(0,I.G)(null==i?void 0:i.current,["template-columns-".concat(e)],(function(n){return t.test(n)}))}}function O(n){var e,t,r=n.uuid,o=document.getElementById(r);o&&(null==o||o.remove()),null!=l&&null!==(e=l.current)&&void 0!==e&&e[r]&&delete l.current[r],null!=_&&null!==(t=_.current)&&void 0!==t&&t[r]&&(_.current[r].unmount(),delete _.current[r]),x()}function T(n){var r=n.apps,c=n.layout,p=n.uuid,f=document.getElementById(p);f&&f.remove();var h=(0,I.$)({uuid:p});(null==c?void 0:c.column)<=-1?null==i||i.current.prepend(h):null==i||i.current.appendChild(h),null==r||r.forEach((function(r,i){var c=r({});if(p===c.uuid)throw new Error("Panel UUID cannot match any app UUID");setTimeout((function(){var r=document.getElementById(p);if(r&&!_.current[p]){_.current[p]=(0,d.createRoot)(r);var i=(0,u.createRef)();l.current[p]=i;var f=s()((function(){return t.e(2359).then(t.bind(t,22359))}),{ssr:!1,loadableGenerated:{webpack:function(){return[22359]}}});_.current[p].render((0,P.jsx)(a.ThemeProvider,{theme:e,children:(0,P.jsx)(f,{apps:[c],operations:(0,o.Z)({},m.T.REMOVE_APP,{effect:function(e,t){var r;return!(null!==(r=Object.keys(t||{}))&&void 0!==r&&r.length)&&O(n)}})})})),x()}}),100*i)}))}return(0,u.useEffect)((function(){if(0===n.current){var e=function(){var e=(0,r.Z)(c().mark((function e(){return c().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,Promise.all([t.e(3528),t.e(3450)]).then(t.bind(t,3528)).then((function(e){e.Manager.loadServices(),n.current=1}));case 2:case"end":return e.stop()}}),e)})));return function(){return e.apply(this,arguments)}}();e()}var o=function(){var n=(0,r.Z)(c().mark((function n(){return c().wrap((function(n){for(;;)switch(n.prev=n.next){case 0:return n.next=2,Promise.all([t.e(3528),t.e(3450)]).then(t.bind(t,3528)).then((function(n){n.Manager.dispose()}));case 2:case"end":return n.stop()}}),n)})));return function(){return n.apply(this,arguments)}}();return function(){o()}}),[]),(0,P.jsx)("div",{className:E().container,children:(0,P.jsxs)(h.Z,{height:"inherit",overflow:"visible",padding:12,rowGap:12,templateColumns:"auto-fill",templateRows:"auto 1fr",width:"100%",children:[(0,P.jsxs)(h.Z,{columnGap:12,overflow:"visible",row:1,templateColumns:"auto 1fr 1fr auto",templateRows:"1fr",width:"inherit",children:[(0,P.jsx)(f.Z,{Icon:g?z.hw8:z.v2r,basic:g,onClick:function(){var n,e;(e=j({operations:(0,o.Z)({},m.T.ADD_PANEL,{effect:T})})).apps=e.apps.map((function(n){return function(e){return n(R(R({},e),{},{operations:R(R({},e.operations||{}),{},(0,o.Z)({},m.T.ADD_PANEL,{effect:T}))}))}})),null!=_&&null!==(n=_.current)&&void 0!==n&&n[e.uuid]?O(e):T(e),y((function(n){return!n}))}}),(0,P.jsx)(p.Z,{monospace:!0,number:!0,placeholder:"Row"}),(0,P.jsx)(p.Z,{monospace:!0,number:!0,placeholder:"Column"}),(0,P.jsx)(f.h,{children:(0,P.jsx)(f.Z,{Icon:z.LP4,onClick:function(){return(0,v.vW)((function(n){var e=n.mode;return{mode:b.H.LIGHT===e?b.H.DARK:b.H.LIGHT}}))},children:"Theme"})})]}),(0,P.jsx)(h.Z,{autoFlow:"column",columnGap:12,ref:i,row:2,templateRows:"1fr",width:"inherit"})]})})}},28189:function(n,e,t){"use strict";var r,o,i,c,u;t.d(e,{Cm:function(){return r},KU:function(){return i},dS:function(){return c},xc:function(){return o}}),function(n){n.FILE_BROWSER="file-browser"}(r||(r={})),function(n){n.DEFAULT="default"}(o||(o={})),function(n){n.BROWSER="browser",n.EDITOR="editor"}(i||(i={})),function(n){n.CANVAS="canvas",n.IDE="ide",n.SYSTEM="system"}(c||(c={})),function(n){n.INITIALIZED="initialized",n.PENDING_LAYOUT="pending_layout",n.READY="ready"}(u||(u={}))},87118:function(n,e,t){"use strict";var r;t.d(e,{T:function(){return r}}),function(n){n.ADD_APP="add-app",n.ADD_PANEL="add-panel",n.REMOVE_APP="remove-app",n.REMOVE_PANEL="remove-panel"}(r||(r={}))},10658:function(n,e,t){"use strict";t.d(e,{$:function(){return l},G:function(){return a}});var r=t(21831),o=t(316),i=t(30884),c=t.n(i),u=/(row-\d+|column-(start|end)-\d+)/;function a(n,e,t){var i,u=[].concat((0,r.Z)(e),[(0,o.xi)(null==n?void 0:n.className,t)]);n.className=null==u||null===(i=u.map((function(n){return n?c()[n]||n:""})))||void 0===i?void 0:i.join(" ")}function l(n){var e=n.layout,t=n.uuid,r=e||{},o=r.column,i=r.columnSpan,c=r.row,l=document.getElementById(t);return l||(l=document.createElement("div")),l.id=t,l.style.display="grid",l.style.gridTemplateRows="inherit",l.style.overflow="hidden",a(l,["grid","grid-cell",void 0!==c?"row-".concat(c+1):"",void 0!==o?"column-start-".concat(o+1):"",void 0!==i?"column-end-".concat(i+2):""],(function(n){return u.test(n)})),l}},79967:function(n,e,t){"use strict";t.d(e,{Z:function(){return g}});var r=t(82394),o=t(26304),i=t(82684),c=t(7810),u=t.n(c),a=t(9518),l=t(54101),s=t(32409),d=t(59886),p=(0,a.css)([""," "," "," "," "," width:",";"," ",""],d.eR,l.ZP,(function(n){return!n.blendWithText&&s.Z}),(function(n){var e=n.basic,t=n.blendWithText,r=n.theme;return!e&&!t&&"\n    border-color: ".concat(r.inputs.border.color.base.default,";\n  ")}),(function(n){var e=n.blendWithText,t=n.small,r=n.theme;return e?"\n    background-color: none;\n    background: none;\n    border-color: none;\n    border-radius: 0;\n    border-style: none;\n    border-width: 0px;\n    borders: none;\n    padding-left: 0;\n    padding-right: 0;\n    padding-bottom: ".concat(t?"4px":r.inputs.padding.vertical.xs,";\n    padding-top: ").concat(t?"4px":r.inputs.padding.vertical.xs,";\n  "):"\n    background: ".concat(r.inputs.background.base.default,";\n    border-radius: ").concat(r.inputs.border.radius.base,";\n    border-style: ").concat(r.inputs.border.style.base,";\n    border-width: ").concat(r.inputs.border.width.base,";\n    padding-left: ").concat(r.inputs.padding.horizontal[t?"sm":"base"],";\n    padding-right: ").concat(r.inputs.padding.horizontal[t?"sm":"base"],";\n    padding-bottom: ").concat(r.inputs.padding.vertical[t?"sm":"base"],";\n    padding-top: ").concat(r.inputs.padding.vertical[t?"sm":"base"],";\n  ")}),(function(n){var e=n.width;return void 0===e?"100%":"number"==typeof e?"".concat(e,"px"):e}),(function(n){var e=n.align,t=n.basic,r=n.blendWithText,o=n.italicPlaceholder,i=n.small,c=n.theme;return"\n    font-family: ".concat(c.fonts.family.base[i?"regular":"medium"],";\n    font-weight: ").concat(c.fonts.weight.medium,";\n    line-height: ").concat(c.fonts.lineHeight.base,";\n    text-align: ").concat(e||"left",";\n\n    ::-webkit-input-placeholder {\n      color: ").concat(c.inputs.placeholder.color,";\n      font-style: ").concat(o?"italic":"normal",";\n    }\n    ::-moz-placeholder {\n      color: ").concat(c.inputs.placeholder.color,";\n      font-style: ").concat(o?"italic":"normal",";\n    }\n    :-ms-input-placeholder {\n      color: ").concat(c.inputs.placeholder.color,";\n      font-style: ").concat(o?"italic":"normal",";\n    }\n    :-moz-placeholder {\n      color: ").concat(c.inputs.placeholder.color,";\n      font-style: ").concat(o?"italic":"normal",";\n    }\n    ::placeholder {\n      color: ").concat(c.inputs.placeholder.color,";\n      font-style: ").concat(o?"italic":"normal",";\n    }\n\n    &:focus {\n      background: ").concat(r?"none":c.inputs.background.base.focus,";\n      border-color: ").concat(r?"none":t?c.inputs.border.color.base.default:c.inputs.border.color.base.focus,";\n    }\n\n    &:hover {\n      background: ").concat(r?"none":c.inputs.background.base.hover,";\n      border-color: ").concat(r?"none":t?c.inputs.border.color.base.default:c.inputs.border.color.base.hover,";\n    }\n\n    &:active {\n      background: ").concat(r?"none":c.inputs.background.base.active,";\n      border-color: ").concat(r?"none":t?c.inputs.border.color.base.default:c.inputs.border.color.base.active,";\n    }\n  ")}),(function(n){var e=n.basic,t=n.blendWithText,r=n.theme;return!t&&(0,d.oJ)({active:!0,borderColor:r.fonts.color.text.inverted,outlineColor:e?r.inputs.border.color.base.default:r.inputs.border.color.base.hover})})),f=(0,a.css)(["",""],p),h=t(28598),b=["Icon","defaultValue","italic","number","onChange","onClick","required","id","name","small"];function m(n,e){var t=Object.keys(n);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(n);e&&(r=r.filter((function(e){return Object.getOwnPropertyDescriptor(n,e).enumerable}))),t.push.apply(t,r)}return t}function v(n){for(var e=1;e<arguments.length;e++){var t=null!=arguments[e]?arguments[e]:{};e%2?m(Object(t),!0).forEach((function(e){(0,r.Z)(n,e,t[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(n,Object.getOwnPropertyDescriptors(t)):m(Object(t)).forEach((function(e){Object.defineProperty(n,e,Object.getOwnPropertyDescriptor(t,e))}))}return n}var _=a.default.input.withConfig({displayName:"TextInput__InputStyled",componentId:"sc-1hk0vg0-0"})(["",""],f);function w(n,e){var t=n.Icon,r=n.defaultValue,c=n.italic,a=n.number,l=n.onChange,s=n.onClick,d=n.required,p=n.id,f=n.name,m=n.small,w=(0,o.Z)(n,b),g=(0,i.useRef)(16),y=(0,i.useState)(r),x=y[0],O=y[1];return(0,h.jsxs)("div",{className:[u().container,t&&u().withIcon].filter(Boolean).join(" "),children:[t&&(0,h.jsx)("div",{className:[u().icon].filter(Boolean).join(" "),children:t((function(n){var e;return g.current=null!==(e=null==n?void 0:n.size)&&void 0!==e?e:g.current,(0,h.jsx)(t,v(v({},n),{},{size:g.current}))}))}),(0,h.jsx)(_,v(v({},w),{},{className:[u().input,t&&u()["with-icon-size-".concat(g.current)]].filter(Boolean).join(" "),id:p,italic:c&&"function"==typeof c?null==c?void 0:c(x):c,name:f,onChange:function(n){O(n.target.value),l&&l(n)},onClick:s,ref:e,required:d,small:m,type:a?"number":"text",value:x||""}))]})}var g=i.forwardRef(w)},70933:function(n){n.exports={container:"Manager_container__HqH0d",expanded:"Manager_expanded__FysDh",collapsed:"Manager_collapsed__hCBY4"}},7810:function(n){n.exports={container:"TextInput_container__YE5_h",input:"TextInput_input__zNGMn","with-icon-size-0":"TextInput_with-icon-size-0__ilF_h","with-icon-size-2":"TextInput_with-icon-size-2__mU7ok","with-icon-size-4":"TextInput_with-icon-size-4__yRML2","with-icon-size-6":"TextInput_with-icon-size-6__yGu0Z","with-icon-size-8":"TextInput_with-icon-size-8__xoxML","with-icon-size-10":"TextInput_with-icon-size-10__R8DBq","with-icon-size-12":"TextInput_with-icon-size-12__g19kX","with-icon-size-14":"TextInput_with-icon-size-14__iaLKo","with-icon-size-16":"TextInput_with-icon-size-16__dqpAg","with-icon-size-18":"TextInput_with-icon-size-18__uBt8j","with-icon-size-20":"TextInput_with-icon-size-20__vdW7m","with-icon-size-22":"TextInput_with-icon-size-22__MWQ6K","with-icon-size-24":"TextInput_with-icon-size-24__0Gil6","with-icon-size-26":"TextInput_with-icon-size-26__aQy8l","with-icon-size-28":"TextInput_with-icon-size-28__uyoT5","with-icon-size-30":"TextInput_with-icon-size-30__cLtaQ","with-icon-size-32":"TextInput_with-icon-size-32__wDmMF","with-icon-size-34":"TextInput_with-icon-size-34__u8FBO","with-icon-size-36":"TextInput_with-icon-size-36__omDB3","with-icon-size-38":"TextInput_with-icon-size-38__WCRfb","with-icon-size-40":"TextInput_with-icon-size-40__NYudf",icon:"TextInput_icon__0oy5p"}},68392:function(n,e,t){"use strict";t.d(e,{p:function(){return c}});var r=t(82684),o=t(49817),i=t(94100);function c(n){const e=(0,r.useRef)(0),{isStatic:t}=(0,r.useContext)(o._);(0,r.useEffect)((()=>{if(t)return;const r=({timestamp:t,delta:r})=>{e.current||(e.current=t),n(t-e.current,r)};return i.Wi.update(r,!0),()=>(0,i.Pn)(r)}),[n])}}}]);