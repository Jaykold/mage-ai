(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[4496],{75083:function(e,r,n){"use strict";n.d(r,{HF:function(){return i},L6:function(){return t}});var t,u=n(82359),o=n(72473);function i(e,r,n){var i=e.owner,s=(e.roles,[{Icon:o.Vz,id:t.WORKSPACES,isSelected:function(){return t.WORKSPACES===n},label:function(){return"Workspaces"},linkProps:{href:"/manage"}}]);return i&&s.push({Icon:o.NO,id:t.USERS,isSelected:function(){return t.USERS===n},label:function(){return"Users"},linkProps:{href:"/manage/users"}}),r==u.k.MAIN&&s.push({Icon:o.Zr,id:t.SETTINGS,isSelected:function(){return t.SETTINGS===n},label:function(){return"Settings"},linkProps:{href:"/manage/settings"}}),s}!function(e){e.WORKSPACES="workspaces",e.USERS="users",e.SETTINGS="settings"}(t||(t={}))},59533:function(e,r,n){"use strict";var t=n(82684),u=n(94629),o=n(35686),i=n(70515),s=n(75083),a=n(50178),c=n(28598);r.Z=function(e){var r=e.before,n=e.breadcrumbs,l=void 0===n?[]:n,d=e.children,v=e.errors,f=e.pageName,p=e.subheaderChildren,m=o.ZP.statuses.list().data,b=(0,t.useMemo)((function(){var e,r;return null===m||void 0===m||null===(e=m.statuses)||void 0===e||null===(r=e[0])||void 0===r?void 0:r.project_type}),[m]),h=(0,a.PR)()||{};return(0,c.jsx)(u.Z,{before:r,beforeWidth:r?50*i.iI:0,breadcrumbs:l,errors:v,navigationItems:(0,s.HF)(h,b,f),subheaderChildren:p,title:"Workspaces",uuid:"workspaces/index",children:d})}},5178:function(e,r,n){"use strict";n.r(r),n.d(r,{default:function(){return R}});var t=n(77837),u=n(38860),o=n.n(u),i=n(82684),s=n(34376),a=n(93808),c=n(38276),l=n(36043),d=n(75582),v=n(21831),f=n(82394),p=n(21764),m=n(69864),b=n(71180),h=n(44085),S=n(75499),g=n(30160),w=n(35686),O=n(86735),j=n(72619),P=n(28598);function _(e,r){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var t=Object.getOwnPropertySymbols(e);r&&(t=t.filter((function(r){return Object.getOwnPropertyDescriptor(e,r).enumerable}))),n.push.apply(n,t)}return n}function k(e){for(var r=1;r<arguments.length;r++){var n=null!=arguments[r]?arguments[r]:{};r%2?_(Object(n),!0).forEach((function(r){(0,f.Z)(e,r,n[r])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):_(Object(n)).forEach((function(r){Object.defineProperty(e,r,Object.getOwnPropertyDescriptor(n,r))}))}return e}var Z=function(e){e.fetchUser;var r=e.user,n=e.workspaces,t=(0,s.useRouter)(),u=(0,i.useState)(),o=u[0],a=u[1],l=(0,i.useState)(!0),_=l[0],Z=l[1];(0,i.useEffect)((function(){r&&a(r)}),[r]);var y=null===n||void 0===n?void 0:n.map((function(e){return e.project_uuid})),E=w.ZP.roles.list({entity:"project",entity_ids:y},{},{}),x=E.data,I=(E.mutate,(0,i.useMemo)((function(){var e=(null===x||void 0===x?void 0:x.roles)||[];return null===e||void 0===e?void 0:e.reduce((function(e,r){var n=r.permissions[0].entity_id,t=e[n]||[];return k(k({},e),{},(0,f.Z)({},n,[].concat((0,v.Z)(t),[r])))}),{})}),[x])),N=(0,i.useMemo)((function(){var e=o||r,n=null===e||void 0===e?void 0:e.roles_new;return null===n||void 0===n?void 0:n.reduce((function(e,r){var n,t,u=null===r||void 0===r||null===(n=r.permissions)||void 0===n||null===(t=n[0])||void 0===t?void 0:t.entity_id;return k(k({},e),{},(0,f.Z)({},u,r))}),{})}),[o,r]),R=(0,m.Db)(w.ZP.users.useUpdate(null===r||void 0===r?void 0:r.id),{onSuccess:function(e){return(0,j.wD)(e,{callback:function(){t.push("/manage/users")},onErrorCallback:function(e){var r=e.error,n=r.errors,t=r.exception,u=r.message,o=r.type;p.Am.error((null===n||void 0===n?void 0:n.error)||t||u,{position:p.Am.POSITION.BOTTOM_RIGHT,toastId:o})}})}}),T=(0,d.Z)(R,2),C=T[0],U=T[1].isLoading;return(0,P.jsxs)(P.Fragment,{children:[(0,P.jsx)(c.Z,{p:2,children:(0,P.jsx)(b.Z,{disabled:_,loading:U,onClick:function(){var e,r=k(k({},o),{},{roles_new:null===o||void 0===o||null===(e=o.roles_new)||void 0===e?void 0:e.map((function(e){return e.id}))});C({user:r})},primary:!0,children:"Update workspace roles"})}),(0,P.jsx)(S.Z,{columnFlex:[1,1],columns:[{uuid:"Workspace"},{uuid:"Role"}],rows:null===n||void 0===n?void 0:n.map((function(e){var r=e.name,n=e.project_uuid,t=(null===I||void 0===I?void 0:I[n])||[],u=null===N||void 0===N?void 0:N[n];return[(0,P.jsx)(g.ZP,{bold:!0,children:r},"name"),(0,P.jsx)(h.Z,{onChange:function(e){Z(!1);var r=(0,O.sE)(t,(function(r){return r.id==e.target.value}));r&&a((function(e){var n,t=(null===e||void 0===e||null===(n=e.roles_new)||void 0===n?void 0:n.filter((function(e){return e.id!=(null===r||void 0===r?void 0:r.id)})))||[],u={roles_new:[].concat((0,v.Z)(t),[r])};return k(k({},e),u)}))},placeholder:"No access",primary:!0,setContentOnMount:!0,value:null===u||void 0===u?void 0:u.id,children:t.map((function(e){var r=e.id,n=e.name;return(0,P.jsx)("option",{value:r,children:n},n)}))},"project_role")]}))})]})},y=n(59533),E=n(70515),x=n(14875),I=n(75083);function N(e){var r=e.user,n=(0,s.useRouter)(),t=(0,i.useState)(null),u=t[0],o=t[1],a=null===r||void 0===r?void 0:r.id,d=w.ZP.users.detail(a),v=d.data,f=d.mutate,p=w.ZP.statuses.list().data,m=(0,i.useMemo)((function(){var e,r;return null===p||void 0===p||null===(e=p.statuses)||void 0===e||null===(r=e[0])||void 0===r?void 0:r.instance_type}),[p]),b=(0,i.useMemo)((function(){return null===v||void 0===v?void 0:v.user}),[v]);(0,i.useEffect)((function(){(0,j.bB)(v,o)}),[v]);var h=w.ZP.workspaces.list({cluster_type:m,user_id:a},{refreshInterval:5e3,revalidateOnFocus:!0}).data,S=(0,i.useMemo)((function(){return(0,P.jsx)(c.Z,{p:E.cd,children:(0,P.jsx)(l.Z,{hideFields:[x.s7],onDeleteSuccess:function(){return n.push("/manage/users")},onSaveSuccess:function(){return n.push("/manage/users")},showDelete:!0,title:"Edit user",user:b})})}),[n,b]),g=(0,i.useMemo)((function(){return null===h||void 0===h?void 0:h.workspaces}),[h]);return(0,P.jsx)(y.Z,{before:S,breadcrumbs:[{label:function(){return"Workspaces"},linkProps:{as:"/manage",href:"/manage"}},{label:function(){return"Users"},linkProps:{as:"/manage/users",href:"/manage/users"}},{bold:!0,label:function(){return(null===b||void 0===b?void 0:b.username)||"User"}}],errors:u,pageName:I.L6.USERS,children:(0,P.jsx)(Z,{fetchUser:f,user:b,workspaces:g})})}N.getInitialProps=function(){var e=(0,t.Z)(o().mark((function e(r){var n;return o().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return n=r.query.user,e.abrupt("return",{user:{id:n}});case 2:case"end":return e.stop()}}),e)})));return function(r){return e.apply(this,arguments)}}();var R=(0,a.Z)(N)},11976:function(e,r,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/manage/users/[user]",function(){return n(5178)}])}},function(e){e.O(0,[844,9902,6358,9696,8264,5499,2536,9774,2888,179],(function(){return r=11976,e(e.s=r);var r}));var r=e.O();_N_E=r}]);