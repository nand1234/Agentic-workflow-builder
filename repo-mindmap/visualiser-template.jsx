import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// DATA — injected by Claude orchestrator
// ═══════════════════════════════════════════════════════════════
const DATA = {
  arch: {
    appPurpose: "E-commerce platform with Symfony backend and Vue 3 frontend",
    architecture: "Layered architecture with thin controllers delegating to services. Doctrine ORM via Repository pattern for all data access. Vue 3 frontend communicates via REST API.",
    techStack: ["Symfony 6", "Vue 3", "Doctrine ORM", "Pinia", "TypeScript"],
    patterns: [
      { name: "Repository Pattern", description: "All DB access isolated in Repository classes injected into Services" },
      { name: "Service Layer", description: "Business logic lives in Services — Controllers stay thin" },
      { name: "Dependency Injection", description: "Symfony DI container wires all dependencies via constructor injection" }
    ],
    domains: [
      { name: "Auth",   description: "Login, registration, JWT tokens",       color: "#4080ff" },
      { name: "Users",  description: "User CRUD and profile management",       color: "#3ecf82" },
      { name: "Orders", description: "Order lifecycle and processing",         color: "#ffaa20" }
    ],
    entryPoints: ["public/index.php", "src/Kernel.php", "frontend/src/main.ts"],
    dataFlow: "HTTP request → Symfony Router → Controller → Service → Repository → Doctrine → DB. Response flows back through Service → Controller → JsonResponse."
  },
  graphs: {
    callMap: {
      "UserService::create": {
        definedIn: { file: "UserService.php", function: "create" },
        calledBy: [
          { file: "UserController.php",  function: "store"      },
          { file: "AdminController.php", function: "createUser" }
        ]
      },
      "UserService::findAll": {
        definedIn: { file: "UserService.php", function: "findAll" },
        calledBy: [{ file: "UserController.php", function: "index" }]
      },
      "UserRepository::save": {
        definedIn: { file: "UserRepository.php", function: "save" },
        calledBy: [
          { file: "UserService.php", function: "create" },
          { file: "UserService.php", function: "update" }
        ]
      }
    },
    apiLinks: [
      { frontend: { file: "userApi.js", function: "getAll"  }, backend: { file: "UserController.php", function: "index" }, method: "GET",  path: "/api/users" },
      { frontend: { file: "userApi.js", function: "create"  }, backend: { file: "UserController.php", function: "store" }, method: "POST", path: "/api/users" }
    ]
  },
  fileMap: {
    "UserController.php": {
      filename: "UserController.php", filepath: "src/Controller/UserController.php",
      type: "php", tier: 2, layer: "controllers", domain: "Users",
      namespace: "App\\Controller", className: "UserController",
      imports: [
        { name: "UserService",   source: "App\\Service\\UserService",                            purpose: "User business logic"   },
        { name: "JsonResponse",  source: "Symfony\\Component\\HttpFoundation\\JsonResponse",      purpose: "HTTP JSON responses"   }
      ],
      variables: [
        { name: "$userService", type: "UserService", description: "Injected — handles all user business logic" }
      ],
      functions: [
        {
          name: "index", visibility: "public",
          purpose: "Returns a paginated list of all users",
          inputs: "Request $request", outputs: "JsonResponse",
          calls: ["UserService::findAll"], route: "GET /api/users", propsEmits: null,
          errorHandling: { hasTryCatch: true, blocks: [{ try: "UserService::findAll()", catch: "\\Exception $e", action: "Returns 500 with error message", finally: null }] }
        },
        {
          name: "store", visibility: "public",
          purpose: "Validates incoming data and creates a new user",
          inputs: "Request $request", outputs: "JsonResponse (201)",
          calls: ["UserService::create"], route: "POST /api/users", propsEmits: null,
          errorHandling: { hasTryCatch: true, blocks: [{ try: "UserService::create()", catch: "ValidationException $e", action: "Returns 422 with field errors", finally: null }] }
        }
      ],
      dependencyMap: ["UserService", "JsonResponse"]
    },
    "AdminController.php": {
      filename: "AdminController.php", filepath: "src/Controller/AdminController.php",
      type: "php", tier: 2, layer: "controllers", domain: "Users",
      namespace: "App\\Controller", className: "AdminController",
      imports: [{ name: "UserService", source: "App\\Service\\UserService", purpose: "User business logic" }],
      variables: [{ name: "$userService", type: "UserService", description: "Injected" }],
      functions: [
        {
          name: "createUser", visibility: "public",
          purpose: "Admin endpoint to create a user with elevated privileges",
          inputs: "Request $request", outputs: "JsonResponse (201)",
          calls: ["UserService::create"], route: "POST /api/admin/users", propsEmits: null,
          errorHandling: { hasTryCatch: false, blocks: [] }
        }
      ],
      dependencyMap: ["UserService"]
    },
    "UserService.php": {
      filename: "UserService.php", filepath: "src/Service/UserService.php",
      type: "php", tier: 3, layer: "services", domain: "Users",
      namespace: "App\\Service", className: "UserService",
      imports: [{ name: "UserRepository", source: "App\\Repository\\UserRepository", purpose: "DB access layer" }],
      variables: [{ name: "$userRepository", type: "UserRepository", description: "Injected — handles all user DB operations" }],
      functions: [
        {
          name: "create", visibility: "public",
          purpose: "Validates data and persists a new user to the database",
          inputs: "array $data", outputs: "User",
          calls: ["UserRepository::save"], route: null, propsEmits: null,
          errorHandling: { hasTryCatch: true, blocks: [{ try: "UserRepository::save()", catch: "\\RuntimeException $e", action: "Throws DomainException with friendly message", finally: null }] }
        },
        {
          name: "findAll", visibility: "public",
          purpose: "Retrieves all users with optional pagination",
          inputs: "int $page = 1, int $limit = 20", outputs: "array",
          calls: ["UserRepository::findPaginated"], route: null, propsEmits: null,
          errorHandling: { hasTryCatch: false, blocks: [] }
        },
        {
          name: "update", visibility: "public",
          purpose: "Updates an existing user's data",
          inputs: "int $id, array $data", outputs: "User",
          calls: ["UserRepository::find", "UserRepository::save"], route: null, propsEmits: null,
          errorHandling: { hasTryCatch: true, blocks: [{ try: "UserRepository::save()", catch: "\\Exception $e", action: "Rolls back and rethrows", finally: "Logs attempt to audit log" }] }
        }
      ],
      dependencyMap: ["UserRepository"]
    },
    "UserRepository.php": {
      filename: "UserRepository.php", filepath: "src/Repository/UserRepository.php",
      type: "php", tier: 4, layer: "repositories", domain: "Users",
      namespace: "App\\Repository", className: "UserRepository",
      imports: [{ name: "EntityManagerInterface", source: "Doctrine\\ORM\\EntityManagerInterface", purpose: "Doctrine ORM" }],
      variables: [{ name: "$em", type: "EntityManagerInterface", description: "Doctrine entity manager" }],
      functions: [
        {
          name: "save", visibility: "public",
          purpose: "Persists a User entity to the database via Doctrine",
          inputs: "User $user", outputs: "void",
          calls: ["EntityManagerInterface::persist", "EntityManagerInterface::flush"], route: null, propsEmits: null,
          errorHandling: { hasTryCatch: false, blocks: [] }
        },
        {
          name: "findPaginated", visibility: "public",
          purpose: "Returns a paginated array of users using QueryBuilder",
          inputs: "int $page, int $limit", outputs: "array",
          calls: ["EntityManagerInterface::createQueryBuilder"], route: null, propsEmits: null,
          errorHandling: { hasTryCatch: false, blocks: [] }
        }
      ],
      dependencyMap: ["EntityManagerInterface"]
    },
    "UsersPage.vue": {
      filename: "UsersPage.vue", filepath: "frontend/src/pages/UsersPage.vue",
      type: "vue", tier: 7, layer: "pages", domain: "Users",
      namespace: null, className: null,
      imports: [
        { name: "useUsers",  source: "@/composables/useUsers", purpose: "User data composable" },
        { name: "UserCard",  source: "@/components/UserCard",  purpose: "User card component"  }
      ],
      variables: [],
      functions: [
        {
          name: "onMounted", visibility: null,
          purpose: "Fetches user list when component mounts",
          inputs: "none", outputs: "void",
          calls: ["useUsers::fetchUsers"], route: null, propsEmits: "props: none, emits: none",
          errorHandling: { hasTryCatch: false, blocks: [] }
        }
      ],
      dependencyMap: ["useUsers", "UserCard"]
    },
    "useUsers.js": {
      filename: "useUsers.js", filepath: "frontend/src/composables/useUsers.js",
      type: "js", tier: 6, layer: "composables", domain: "Users",
      namespace: null, className: null,
      imports: [
        { name: "userApi",       source: "@/api/userApi",        purpose: "API call layer"  },
        { name: "useUserStore",  source: "@/store/userStore",    purpose: "Pinia user store" }
      ],
      variables: [
        { name: "loading", type: "Ref<boolean>",    description: "Loading state flag"     },
        { name: "error",   type: "Ref<string|null>", description: "Error message or null" }
      ],
      functions: [
        {
          name: "fetchUsers", visibility: null,
          purpose: "Fetches all users from API and commits them to Pinia store",
          inputs: "none", outputs: "Promise<void>",
          calls: ["userApi::getAll", "useUserStore::setUsers"], route: null, propsEmits: null,
          errorHandling: { hasTryCatch: true, blocks: [{ try: "userApi.getAll()", catch: "AxiosError", action: "Sets error.value with message", finally: "Sets loading.value = false" }] }
        }
      ],
      dependencyMap: ["userApi", "useUserStore"]
    },
    "userApi.js": {
      filename: "userApi.js", filepath: "frontend/src/api/userApi.js",
      type: "js", tier: 5, layer: "api", domain: "Users",
      namespace: null, className: null,
      imports: [{ name: "axios", source: "axios", purpose: "HTTP client" }],
      variables: [{ name: "BASE_URL", type: "string", description: "API base path: /api/users" }],
      functions: [
        {
          name: "getAll", visibility: null,
          purpose: "Fetches paginated list of users from Symfony backend",
          inputs: "params?: object", outputs: "Promise<User[]>",
          calls: ["axios.get"], route: null, propsEmits: null,
          errorHandling: { hasTryCatch: true, blocks: [{ try: "axios.get('/api/users')", catch: "AxiosError (500)", action: "Throws new Error('Server error')", finally: null }] }
        },
        {
          name: "create", visibility: null,
          purpose: "Posts new user payload to Symfony backend",
          inputs: "data: UserPayload", outputs: "Promise<User>",
          calls: ["axios.post"], route: null, propsEmits: null,
          errorHandling: { hasTryCatch: true, blocks: [{ try: "axios.post('/api/users', data)", catch: "AxiosError (422)", action: "Throws validation error with field messages", finally: null }] }
        }
      ],
      dependencyMap: ["axios"]
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════════
const T = {
  bg:       "#05070f",
  treeBg:   "#07090e",
  surface:  "#090c16",
  card:     "#0d1020",
  cardHi:   "#111828",
  cardSel:  "#172038",
  border:   "#16203a",
  borderHi: "#243058",
  accent:   "#4080ff",
  vue:      "#3ecf82",
  php:      "#a07aff",
  apiLink:  "#ff6060",
  combined: "#ffaa20",
  patterns: "#20c0d0",
  text:     "#cdd8f0",
  textDim:  "#8090b8",
  dim:      "#3a4560",
  success:  "#22c55e",
  error:    "#ff5e5e",
  warn:     "#ffb830",
};

const LAYER_COLOR = {
  pages:        "#4080ff",
  components:   "#06b6d4",
  composables:  "#3ecf82",
  store:        "#ffaa20",
  api:          "#ff6060",
  controllers:  "#a07aff",
  services:     "#7c5fe0",
  repositories: "#5e40c8",
  entities:     "#4530a0",
  db:           "#2e1e78",
  other:        "#4a5580",
};

const LAYER_ORDER = ["pages","components","composables","store","api","controllers","services","repositories","entities","db","other"];
const LAYER_SIDE  = { pages:"fe", components:"fe", composables:"fe", store:"fe", api:"fe", controllers:"be", services:"be", repositories:"be", entities:"be", db:"be" };

// ═══════════════════════════════════════════════════════════════
// ANIMATED CROSS-LINK OVERLAY
// ═══════════════════════════════════════════════════════════════
function CrossLinks({ links, containerRef }) {
  const [paths, setPaths] = useState([]);

  useEffect(() => {
    if (!links.length || !containerRef.current) { setPaths([]); return; }
    const cr = containerRef.current.getBoundingClientRect();

    const computed = links.map(link => {
      const fromEl = containerRef.current.querySelector(`[data-fnkey="${link.from}"]`);
      const toEl   = containerRef.current.querySelector(`[data-fnkey="${link.to}"]`);
      if (!fromEl || !toEl) return null;
      const fr = fromEl.getBoundingClientRect();
      const tr = toEl.getBoundingClientRect();
      const x1 = fr.right  - cr.left;
      const y1 = fr.top    + fr.height / 2 - cr.top;
      const x2 = tr.left   - cr.left;
      const y2 = tr.top    + tr.height / 2 - cr.top;
      const spread = Math.abs(x2 - x1) * 0.55;
      return {
        id:    link.id,
        color: link.color,
        d: `M${x1},${y1} C${x1 + spread},${y1} ${x2 - spread},${y2} ${x2},${y2}`,
      };
    }).filter(Boolean);

    setPaths(computed);
  }, [links]);

  if (!paths.length) return null;

  return (
    <svg style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:20, width:"100%", height:"100%", overflow:"visible" }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        {paths.map(p => (
          <marker key={`m-${p.id}`} id={`arr-${p.id}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 z" fill={p.color}/>
          </marker>
        ))}
      </defs>
      {paths.map(p => (
        <g key={p.id} filter="url(#glow)">
          <path d={p.d} fill="none" stroke={p.color} strokeWidth={5} opacity={0.08}/>
          <path d={p.d} fill="none" stroke={p.color} strokeWidth={1.5} opacity={0.9}
            strokeDasharray="7 4" markerEnd={`url(#arr-${p.id})`}>
            <animate attributeName="stroke-dashoffset" from="110" to="0" dur="1.4s" repeatCount="indefinite"/>
          </path>
        </g>
      ))}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// FUNCTION ROW
// ═══════════════════════════════════════════════════════════════
function FnRow({ fn, file, selected, onClick, callerCount, isLinked }) {
  const color    = LAYER_COLOR[file.layer] || T.accent;
  const fnKey    = `${file.filename}::${fn.name}`;
  const isSel    = selected?.file === file.filename && selected?.fn?.name === fn.name;

  return (
    <div
      data-fnkey={fnKey}
      onClick={() => onClick(file, fn)}
      style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "5px 10px 5px 30px",
        background: isSel ? T.cardSel : isLinked ? `${color}0a` : "transparent",
        borderLeft: `2px solid ${isSel ? color : isLinked ? color + "60" : "transparent"}`,
        cursor: "pointer", borderRadius: 3, transition: "all 0.15s", marginBottom: 1,
      }}
    >
      <div style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
        background: fn.errorHandling?.hasTryCatch ? color : T.error }} />
      <span style={{ color: isSel ? T.text : T.textDim, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", flex: 1 }}>
        {fn.name}()
      </span>
      {fn.route && (
        <span style={{ background:`${T.vue}18`, color:T.vue, borderRadius:3, padding:"1px 5px", fontSize:9, fontFamily:"monospace" }}>
          {fn.route.split(" ")[0]}
        </span>
      )}
      {callerCount > 1 && (
        <span style={{ background:`${T.combined}20`, color:T.combined, borderRadius:10, padding:"1px 7px", fontSize:9, fontFamily:"monospace", fontWeight:700 }}>
          {callerCount}×
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FILE NODE
// ═══════════════════════════════════════════════════════════════
function FileNode({ file, selected, onSelect, callMap, linkedFns }) {
  const [open, setOpen]   = useState(false);
  const color             = LAYER_COLOR[file.layer] || T.accent;
  const isFileSel         = selected?.file === file.filename;
  const domainColor       = DATA.arch?.domains?.find(d => d.name === file.domain)?.color;

  const callerCountFor = (fn) => {
    const key = `${file.className || file.filename.replace(/\.(php|vue|js|ts)/,"")}::${fn.name}`;
    return callMap[key]?.calledBy?.length || 0;
  };

  return (
    <div>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display:"flex", alignItems:"center", gap:8, padding:"6px 10px 6px 14px",
          background: isFileSel && !open ? T.cardHi : "transparent",
          borderLeft: `3px solid ${open || isFileSel ? color : "transparent"}`,
          cursor:"pointer", borderRadius:4, transition:"all 0.15s", marginBottom:1,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = T.card; }}
        onMouseLeave={e => { e.currentTarget.style.background = isFileSel && !open ? T.cardHi : "transparent"; }}
      >
        <span style={{ color:T.dim, fontSize:9, width:10 }}>{open?"▾":"▸"}</span>
        <span style={{ color, fontSize:9, fontWeight:700, width:28, fontFamily:"monospace" }}>
          {file.type === "php" ? "PHP" : file.type.toUpperCase()}
        </span>
        <span style={{ color:T.text, fontSize:11, fontFamily:"'IBM Plex Mono', monospace", flex:1 }}>
          {file.filename}
        </span>
        {domainColor && (
          <div style={{ width:6, height:6, borderRadius:2, background:domainColor, flexShrink:0 }}/>
        )}
      </div>

      {open && (
        <div style={{ borderLeft:`1px solid ${T.border}`, marginLeft:20 }}>
          {file.functions?.map(fn => (
            <FnRow key={fn.name} fn={fn} file={file} selected={selected}
              onClick={onSelect}
              callerCount={callerCountFor(fn)}
              isLinked={linkedFns.has(`${file.filename}::${fn.name}`)} />
          ))}
          {(!file.functions || !file.functions.length) && (
            <div style={{ color:T.dim, fontSize:10, padding:"4px 10px 4px 28px", fontFamily:"monospace" }}>no functions</div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TREE PANEL
// ═══════════════════════════════════════════════════════════════
function TreePanel({ fileMap, selected, onSelect, callMap, linkedFns }) {
  const [filter, setFilter] = useState("all");

  const byLayer = {};
  Object.values(fileMap).forEach(f => {
    const l = f.layer || "other";
    if (filter === "fe" && LAYER_SIDE[l] !== "fe") return;
    if (filter === "be" && LAYER_SIDE[l] !== "be") return;
    (byLayer[l] = byLayer[l] || []).push(f);
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, display:"flex", gap:4, flexShrink:0 }}>
        {[["all","All"],["fe","Frontend"],["be","Backend"]].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            background: filter===v ? `${T.accent}20` : "transparent",
            border: `1px solid ${filter===v ? T.accent+"60" : T.border}`,
            color: filter===v ? T.accent : T.dim,
            borderRadius:5, padding:"3px 10px", cursor:"pointer",
            fontFamily:"'IBM Plex Mono', monospace", fontSize:10,
          }}>{l}</button>
        ))}
      </div>
      <div style={{ overflowY:"auto", flex:1, padding:"8px 4px" }}>
        {LAYER_ORDER.map(layer => {
          const files = byLayer[layer];
          if (!files?.length) return null;
          return (
            <div key={layer} style={{ marginBottom:10 }}>
              <div style={{ color:LAYER_COLOR[layer]||T.dim, fontSize:8, fontWeight:700, letterSpacing:2, padding:"3px 12px", fontFamily:"'IBM Plex Mono', monospace", opacity:0.65 }}>
                {layer.toUpperCase()}
              </div>
              {files.map(f => (
                <FileNode key={f.filename} file={f} selected={selected}
                  onSelect={onSelect} callMap={callMap} linkedFns={linkedFns}/>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DETAIL PANEL HELPERS
// ═══════════════════════════════════════════════════════════════
function Section({ color, title, children }) {
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
        <div style={{ width:3, height:10, background:color, borderRadius:2 }}/>
        <span style={{ color, fontSize:9, fontWeight:700, letterSpacing:2, fontFamily:"'IBM Plex Mono', monospace" }}>{title}</span>
      </div>
      <div style={{ paddingLeft:10 }}>{children}</div>
    </div>
  );
}

function KV({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display:"flex", gap:10, marginBottom:4 }}>
      <span style={{ color:T.dim, fontSize:11, width:58, flexShrink:0, fontFamily:"monospace" }}>{label}</span>
      <span style={{ color:T.text, fontSize:11, fontFamily:"'IBM Plex Mono', monospace" }}>{value}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DETAIL PANEL
// ═══════════════════════════════════════════════════════════════
function DetailPanel({ file, fn, callMap, onNavigate }) {
  if (!file) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:T.dim, fontFamily:"'IBM Plex Mono', monospace", gap:8 }}>
      <div style={{ fontSize:40, opacity:0.15 }}>⬡</div>
      <div style={{ fontSize:12 }}>Select a function from the tree</div>
      <div style={{ fontSize:10, opacity:0.5 }}>cross-links appear when a function is selected</div>
    </div>
  );

  const color   = LAYER_COLOR[file.layer] || T.accent;
  const domain  = DATA.arch?.domains?.find(d => d.name === file.domain);

  if (!fn) {
    return (
      <div style={{ padding:"20px", overflowY:"auto", height:"100%", fontFamily:"'IBM Plex Mono', monospace" }}>
        <div style={{ color:T.dim, fontSize:9, letterSpacing:2, marginBottom:4 }}>{(file.layer||"other").toUpperCase()}</div>
        <div style={{ fontSize:16, fontWeight:800, color:T.text, marginBottom:4 }}>{file.filename}</div>
        <div style={{ color:T.dim, fontSize:10, marginBottom:16 }}>{file.filepath}</div>
        {file.namespace && <div style={{ color:T.dim, fontSize:11, marginBottom:16 }}>ns {file.namespace}</div>}
        {domain && (
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:`${domain.color}18`, border:`1px solid ${domain.color}40`, borderRadius:4, padding:"3px 10px", marginBottom:16 }}>
            <div style={{ width:6, height:6, borderRadius:2, background:domain.color }}/>
            <span style={{ color:domain.color, fontSize:10 }}>{domain.name}</span>
          </div>
        )}
        <Section color={color} title="IMPORTS">
          {file.imports?.map(i => (
            <div key={i.name} style={{ marginBottom:8 }}>
              <div style={{ color:color, fontSize:12 }}>{i.name}</div>
              <div style={{ color:T.dim, fontSize:10 }}>{i.source}</div>
              <div style={{ color:T.textDim, fontSize:11 }}>{i.purpose}</div>
            </div>
          ))}
        </Section>
        <Section color={color} title="VARIABLES">
          {file.variables?.map(v => (
            <div key={v.name} style={{ marginBottom:6 }}>
              <span style={{ color:color, fontSize:11 }}>{v.name} </span>
              <span style={{ color:T.dim, fontSize:10 }}>{v.type} — {v.description}</span>
            </div>
          ))}
        </Section>
      </div>
    );
  }

  const clsName  = file.className || file.filename.replace(/\.(php|vue|js|ts)/,"");
  const fnKey    = `${clsName}::${fn.name}`;
  const mapEntry = callMap[fnKey];
  const calledBy = mapEntry?.calledBy || [];

  return (
    <div style={{ padding:"20px", overflowY:"auto", height:"100%", fontFamily:"'IBM Plex Mono', monospace" }}>
      {/* header */}
      <div style={{ marginBottom:16 }}>
        <div style={{ color:T.dim, fontSize:9, letterSpacing:2, marginBottom:4 }}>{file.filename}</div>
        <div style={{ fontSize:18, fontWeight:800, color:T.text, letterSpacing:-0.5 }}>{fn.name}()</div>
        {fn.visibility && <div style={{ color:T.dim, fontSize:10, marginTop:2 }}>{fn.visibility}</div>}
        <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
          {fn.route && (
            <span style={{ background:`${T.vue}18`, color:T.vue, borderRadius:4, padding:"3px 10px", fontSize:10 }}>
              🛣 {fn.route}
            </span>
          )}
          {!fn.errorHandling?.hasTryCatch && (
            <span style={{ background:`${T.error}18`, color:T.error, borderRadius:4, padding:"3px 10px", fontSize:10 }}>
              ⚠ no try/catch
            </span>
          )}
          {calledBy.length > 0 && (
            <span style={{ background:`${T.combined}18`, color:T.combined, borderRadius:4, padding:"3px 10px", fontSize:10 }}>
              {calledBy.length} caller{calledBy.length>1?"s":""}
            </span>
          )}
        </div>
      </div>

      <Section color={color} title="PURPOSE">
        <div style={{ color:T.text, fontSize:13, lineHeight:1.7 }}>{fn.purpose}</div>
      </Section>

      <Section color={T.accent} title="INPUTS / OUTPUTS">
        <KV label="inputs"  value={fn.inputs} />
        <KV label="outputs" value={fn.outputs} />
      </Section>

      {fn.calls?.length > 0 && (
        <Section color={T.combined} title="CALLS">
          {fn.calls.map(c => {
            const [cls,method] = c.split("::");
            return (
              <div key={c} onClick={() => onNavigate(c)}
                style={{ marginBottom:5, cursor:"pointer", padding:"4px 8px", borderRadius:4, border:`1px solid ${T.border}`, display:"inline-block", marginRight:6 }}>
                <span style={{ color:T.combined, fontSize:11 }}>{cls}</span>
                {method && <><span style={{ color:T.dim }}>::</span><span style={{ color:T.text, fontSize:11 }}>{method}()</span></>}
              </div>
            );
          })}
        </Section>
      )}

      {calledBy.length > 0 && (
        <Section color={T.php} title={`CALLED BY (${calledBy.length})`}>
          {calledBy.map((c,i) => (
            <div key={i} onClick={() => onNavigate(`${c.file}::${c.function}`)}
              style={{ marginBottom:5, cursor:"pointer", padding:"4px 8px", borderRadius:4, border:`1px solid ${T.border}` }}>
              <span style={{ color:T.php, fontSize:11 }}>{c.file}</span>
              <span style={{ color:T.dim }}>::</span>
              <span style={{ color:T.text, fontSize:11 }}>{c.function}()</span>
            </div>
          ))}
        </Section>
      )}

      <Section color={T.warn} title="ERROR HANDLING">
        {fn.errorHandling?.hasTryCatch && fn.errorHandling.blocks?.length > 0
          ? fn.errorHandling.blocks.map((b,i) => (
            <div key={i} style={{ background:T.surface, borderRadius:6, padding:"10px 12px", marginBottom:6, lineHeight:1.8 }}>
              <div><span style={{ color:T.success, fontSize:11 }}>try </span><span style={{ color:T.textDim, fontSize:11 }}>{b.try}</span></div>
              <div><span style={{ color:T.error, fontSize:11 }}>catch </span><span style={{ color:T.textDim, fontSize:11 }}>{b.catch}</span></div>
              <div style={{ color:T.dim, fontSize:11, marginLeft:16 }}>→ {b.action}</div>
              {b.finally && b.finally!=="null" && (
                <div><span style={{ color:T.patterns, fontSize:11 }}>finally </span><span style={{ color:T.textDim, fontSize:11 }}>{b.finally}</span></div>
              )}
            </div>
          ))
          : <div style={{ color:T.error, fontSize:12, fontStyle:"italic" }}>⚠ No try/catch — exceptions may be unhandled</div>
        }
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ARCH BAR
// ═══════════════════════════════════════════════════════════════
function ArchBar({ arch }) {
  const [open, setOpen] = useState(false);
  if (!arch?.appPurpose) return null;
  return (
    <div style={{ borderBottom:`1px solid ${T.border}`, background:T.surface, flexShrink:0 }}>
      <div onClick={() => setOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 18px", cursor:"pointer" }}>
        <span style={{ color:T.dim, fontSize:9 }}>{open?"▾":"▸"}</span>
        <span style={{ color:T.text, fontSize:11, fontWeight:600, fontFamily:"'IBM Plex Mono', monospace", flex:1 }}>{arch.appPurpose}</span>
        <div style={{ display:"flex", gap:5 }}>
          {arch.techStack?.slice(0,5).map(t => (
            <span key={t} style={{ background:`${T.accent}18`, color:T.accent, borderRadius:3, padding:"1px 7px", fontSize:9 }}>{t}</span>
          ))}
        </div>
      </div>
      {open && (
        <div style={{ padding:"0 18px 14px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div>
            <div style={{ color:T.dim, fontSize:8, letterSpacing:2, marginBottom:8, fontFamily:"monospace" }}>DOMAINS</div>
            {arch.domains?.map(d => (
              <div key={d.name} style={{ display:"flex", gap:8, marginBottom:6, alignItems:"flex-start" }}>
                <div style={{ width:7, height:7, borderRadius:2, background:d.color, marginTop:3, flexShrink:0 }}/>
                <div>
                  <div style={{ color:T.text, fontSize:11, fontWeight:600, fontFamily:"monospace" }}>{d.name}</div>
                  <div style={{ color:T.dim, fontSize:10 }}>{d.description}</div>
                </div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ color:T.dim, fontSize:8, letterSpacing:2, marginBottom:8, fontFamily:"monospace" }}>PATTERNS</div>
            {arch.patterns?.map(p => (
              <div key={p.name} style={{ marginBottom:6 }}>
                <div style={{ color:T.patterns, fontSize:11, fontWeight:600, fontFamily:"monospace" }}>{p.name}</div>
                <div style={{ color:T.dim, fontSize:10 }}>{p.description}</div>
              </div>
            ))}
            {arch.dataFlow && (
              <div style={{ marginTop:10, borderTop:`1px solid ${T.border}`, paddingTop:8, color:T.dim, fontSize:10, lineHeight:1.7 }}>{arch.dataFlow}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const { arch, graphs, fileMap } = DATA;
  const callMap    = graphs?.callMap  || {};
  const apiLinks   = graphs?.apiLinks || [];

  const [selected,  setSelected]  = useState(null);
  const [links,     setLinks]     = useState([]);
  const [linkedFns, setLinkedFns] = useState(new Set());
  const containerRef = useRef(null);

  // rebuild cross-links on selection change
  useEffect(() => {
    if (!selected?.fn) { setLinks([]); setLinkedFns(new Set()); return; }
    const { file: selFile, fn: selFn } = selected;
    const clsName = fileMap[selFile]?.className || selFile.replace(/\.(php|vue|js|ts)/,"");
    const fnKey   = `${clsName}::${selFn.name}`;
    const mapEntry = callMap[fnKey];
    const newLinks = [];
    const fns      = new Set();

    // callers → this function
    mapEntry?.calledBy?.forEach((c,i) => {
      const fromKey = `${c.file}::${c.function}`;
      const toKey   = `${selFile}::${selFn.name}`;
      newLinks.push({ id:`cb-${i}`, from:fromKey, to:toKey, color:T.combined });
      fns.add(fromKey); fns.add(toKey);
    });

    // this function → its callees
    selFn.calls?.forEach((call,i) => {
      const [cls,method] = call.split("::");
      if (!method) return;
      const defFile = Object.values(fileMap).find(f =>
        (f.className===cls || f.filename.includes(cls)) && f.functions?.find(fn=>fn.name===method)
      );
      if (defFile) {
        const fromKey = `${selFile}::${selFn.name}`;
        const toKey   = `${defFile.filename}::${method}`;
        newLinks.push({ id:`cl-${i}`, from:fromKey, to:toKey, color:T.apiLink });
        fns.add(fromKey); fns.add(toKey);
      }
    });

    // API links
    apiLinks.forEach((link,i) => {
      if (link.frontend.file===selFile && link.frontend.function===selFn.name) {
        const fromKey = `${link.frontend.file}::${link.frontend.function}`;
        const toKey   = `${link.backend.file}::${link.backend.function}`;
        newLinks.push({ id:`api-${i}`, from:fromKey, to:toKey, color:T.apiLink });
        fns.add(fromKey); fns.add(toKey);
      }
    });

    setLinks(newLinks);
    setLinkedFns(fns);
  }, [selected]);

  const handleSelect = useCallback((file, fn) => {
    setSelected(s => s?.file===file.filename && s?.fn?.name===fn.name ? null : { file:file.filename, fn });
  }, []);

  const handleNavigate = useCallback((callRef) => {
    const [cls, method] = callRef.split("::");
    const target = Object.values(fileMap).find(f =>
      f.filename===cls || f.className===cls || f.filename.replace(/\.(php|vue|js|ts)/,"")===cls
    );
    if (!target) return;
    const targetFn = target.functions?.find(fn=>fn.name===method);
    if (targetFn) setSelected({ file:target.filename, fn:targetFn });
  }, []);

  const selFile = selected ? fileMap[selected.file] : null;
  const selFn   = selected?.fn || null;

  return (
    <div style={{ background:T.bg, height:"100vh", display:"flex", flexDirection:"column", overflow:"hidden", fontFamily:"'IBM Plex Mono', monospace" }}>

      {/* header */}
      <div style={{ borderBottom:`1px solid ${T.border}`, padding:"11px 18px", display:"flex", alignItems:"center", gap:12, flexShrink:0, background:T.surface }}>
        <div style={{ fontSize:14, fontWeight:800 }}>
          <span style={{ color:T.accent }}>⬡ CODE</span><span style={{ color:T.dim }}>MAP</span>
        </div>
        <div style={{ width:1, height:14, background:T.border }}/>
        <div style={{ display:"flex", gap:14 }}>
          {[
            { v:Object.keys(fileMap).length,    l:"files",    c:T.accent   },
            { v:arch?.domains?.length||0,        l:"domains",  c:T.combined },
            { v:arch?.patterns?.length||0,       l:"patterns", c:T.patterns },
            { v:Object.keys(callMap).length,     l:"links",    c:T.php      },
          ].map(s=>(
            <div key={s.l} style={{ display:"flex", alignItems:"baseline", gap:4 }}>
              <span style={{ color:s.c, fontWeight:700, fontSize:13 }}>{s.v}</span>
              <span style={{ color:T.dim, fontSize:9 }}>{s.l}</span>
            </div>
          ))}
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:6, alignItems:"center" }}>
          {links.length>0 && (
            <div style={{ background:`${T.combined}15`, border:`1px solid ${T.combined}40`, borderRadius:4, padding:"2px 10px", color:T.combined, fontSize:9 }}>
              {links.length} active link{links.length>1?"s":""}
            </div>
          )}
          <span style={{ background:`${T.php}18`, color:T.php, borderRadius:4, padding:"2px 8px", fontSize:9 }}>Symfony</span>
          <span style={{ background:`${T.vue}18`, color:T.vue, borderRadius:4, padding:"2px 8px", fontSize:9 }}>Vue 3</span>
        </div>
      </div>

      {/* arch bar */}
      <ArchBar arch={arch}/>

      {/* legend */}
      <div style={{ borderBottom:`1px solid ${T.border}`, padding:"5px 18px", display:"flex", gap:14, flexShrink:0, background:T.treeBg }}>
        {[
          { c:T.success,  l:"try/catch present" },
          { c:T.error,    l:"no error handling" },
          { c:T.combined, l:"called-by link"    },
          { c:T.apiLink,  l:"calls / API link"  },
        ].map(l=>(
          <div key={l.l} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:l.c }}/>
            <span style={{ color:T.dim, fontSize:9 }}>{l.l}</span>
          </div>
        ))}
        <span style={{ color:T.dim, fontSize:9, marginLeft:"auto" }}>click a function to show links</span>
      </div>

      {/* main split */}
      <div ref={containerRef} style={{ flex:1, display:"flex", overflow:"hidden", position:"relative" }}>
        <CrossLinks links={links} containerRef={containerRef}/>

        {/* tree */}
        <div style={{ width:290, borderRight:`1px solid ${T.border}`, background:T.treeBg, overflow:"hidden", display:"flex", flexDirection:"column", flexShrink:0 }}>
          <TreePanel fileMap={fileMap} selected={selected} onSelect={handleSelect} callMap={callMap} linkedFns={linkedFns}/>
        </div>

        {/* detail */}
        <div style={{ flex:1, overflow:"hidden" }}>
          <DetailPanel file={selFile} fn={selFn} callMap={callMap} onNavigate={handleNavigate}/>
        </div>
      </div>

    </div>
  );
}
