"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[9975],{80081:function(e,t,n){n.r(t),n.d(t,{default:function(){return M}});var r=n(82394),u=n(26304),o=n(5508),i=n(1887),c=n.n(i),s=n(82684),l=n(28598),a=function(e){var t=e.title;return(0,l.jsxs)(c(),{children:[(0,l.jsx)("title",{children:t}),(0,l.jsx)("link",{href:"/images/favicons/pro.ico",rel:"icon"}),(0,l.jsx)("style",{id:"dynamic-style-root"}),(0,l.jsx)("meta",{content:"width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=0",name:"viewport"})]})},f=s.memo(a,(function(e,t){return e.title===t.title})),d=n(51721),h=n.n(d),m=n(75502),v=n(94537);function p(e){var t=e.headerRef,n=(0,v.$Y)().initialize;return(0,l.jsx)(m.I,{onMount:function(){return n({headerRef:t})},uuid:"HeaderPortal",children:(0,l.jsx)("header",{className:h().header,ref:t})})}var j=n(70737),b=n(22306),O=n(9518),g=n(31237),x=["mode","themeSettings","title","version"];function y(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function w(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?y(Object(n),!0).forEach((function(t){(0,r.Z)(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):y(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}var M=function(e){var t=e.Component,n=e.pageProps,r=n.mode,i=n.themeSettings,c=n.title,a=n.version,d=(0,u.Z)(n,x),h=e.router,m=(0,s.useRef)(null),v=(0,s.useState)((null==i?void 0:i[a])||(0,g.RX)()),y=v[0],M=v[1],P=(0,s.useCallback)((function(e){(0,g.vW)(e),M(e)}),[]),R=(0,s.useMemo)((function(){return(null==y?void 0:y.theme)||(0,g.gh)({theme:y})}),[y]),k=(0,s.useMemo)((function(){return(null==y?void 0:y.mode)||r||b.H.DARK}),[r,y]);(0,s.useEffect)((function(){"undefined"!=typeof document&&(document.body.removeAttribute("data-theme"),document.body.setAttribute("data-theme",k))}),[k]);var E=(0,s.useMemo)((function(){return(0,l.jsx)(f,{title:null!=c?c:"Mage Pro"})}),[c]);return(0,l.jsxs)(l.Fragment,{children:[E,(0,l.jsx)(O.ThemeProvider,{theme:R,children:(0,l.jsx)(j.Kb,{children:(0,l.jsxs)(o.default,{base:!0,main:!0,router:h,theme:R,updateThemeSettings:P,children:[(0,l.jsx)(p,{headerRef:m}),(0,l.jsx)(t,w(w({},d),{},{updateThemeSettings:P}))]})})})]})}},75502:function(e,t,n){n.d(t,{I:function(){return i}});var r=n(53860),u=n(82684),o=n(28598);function i(e){var t=e.children,n=e.onMount,i=e.uuid,c=e.waitUntil,s=e.maxAttempts,l=void 0===s?10:s,a=e.pollInterval,f=void 0===a?100:a,d=e.withRef,h=e.strict,m=void 0!==h&&h,v=(0,u.useRef)(0),p=(0,u.useRef)(0),j=(0,u.useRef)(null),b=(0,u.useRef)(null);return(m?u.useLayoutEffect:u.useEffect)((function(){if(!(p.current>=l)){r.e.hooks.withOnMount&&console.log("[WithOnMount:".concat(i,":").concat(v.current,"]")),0===v.current&&(j.current=setTimeout((function e(){clearTimeout(j.current),p.current+=1,p.current>=l?r.e.hooks.withOnMount&&console.log("[WithOnMount]: maxAttempts reached"):0!==v.current||!n||c&&!c(d?b:null)||d&&(null==b||!b.current)?j.current=setTimeout(e,f):(r.e.hooks.withOnMount&&console.log("[WithOnMount:".concat(i,":").concat(v.current,"]")),d?n(b):n(),v.current+=1)}),f));var e=j.current;return function(){clearTimeout(e),p.current=0,v.current=0,j.current=null}}}),[l,n,f]),d?(0,o.jsx)("div",{ref:b,children:t}):(0,o.jsx)(o.Fragment,{children:t})}}}]);