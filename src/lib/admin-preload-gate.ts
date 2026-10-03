import { ADMIN_SESSION_KEY } from "./admin-auth";
import { ADMIN_SESSION_TTL_MS } from "./admin-session-policy";

/**
 * Runs before React hydrates on /admin/* (except login). Redirects guests to login immediately
 * so cached dashboard HTML cannot appear as “logged in”.
 */
export const ADMIN_PRELOAD_GATE_SCRIPT = `(function(){try{
var p=location.pathname;
if(p.indexOf("/admin/login")===0)return;
if(p!=="/admin"&&p.indexOf("/admin/")!==0)return;
var raw=localStorage.getItem("${ADMIN_SESSION_KEY}");
if(!raw){location.replace("/admin/login/?next="+encodeURIComponent(p+location.search));return;}
var s=JSON.parse(raw);
if(!s||!s.userId||!s.username||!s.loggedInAt){localStorage.removeItem("${ADMIN_SESSION_KEY}");location.replace("/admin/login/?next="+encodeURIComponent(p+location.search));return;}
var t=Date.parse(s.loggedInAt);
if(!t||Date.now()-t>${ADMIN_SESSION_TTL_MS}){localStorage.removeItem("${ADMIN_SESSION_KEY}");location.replace("/admin/login/?next="+encodeURIComponent(p+location.search));return;}
document.documentElement.setAttribute("data-admin-session","1");
}catch(e){location.replace("/admin/login/");}})();`;
