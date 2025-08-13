import { useEffect, useMemo, useState } from "https://esm.sh/react@18";
import { createRoot } from "https://esm.sh/react-dom@18/client";

const API = "http://localhost:4000"; // Cambia si despliegas el server en otro host

function JsonBlock({ title, data }) {
  return (
    <div className="card">
      <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
        <h3 style={{margin:0}}>{title}</h3>
        <span className="badge">JSON</span>
      </div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

function InitForm({ onResponse }) {
  const [rank, setRank] = useState("Ancient 3");
  const [hero, setHero] = useState("Abaddon");
  const [role, setRole] = useState("Hard Support");
  const [enemies, setEnemies] = useState(["Void","Sniper","Treant Protector","Dragon Knight","Jakiro"]);
  const [constraints, setConstraints] = useState("");

  const enemiesText = enemies.join(", ");

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      rank, hero, role,
      enemies: enemiesText.split(",").map(s => s.trim()).filter(Boolean).slice(0,5),
      patch: "7.39d",
      constraints
    };
    try {
      const r = await fetch(`${API}/init`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      const json = await r.json();
      onResponse(json);
    } catch (err) { onResponse({ error: String(err) }); }
  };

  return (
    <form className="card" onSubmit={submit}>
      <h2>Configuración inicial</h2>
      <div className="row">
        <label>Rank<br/>
          <input value={rank} onChange={e=>setRank(e.target.value)} placeholder="Ancient 3" />
        </label>
        <label>Héroe<br/>
          <input value={hero} onChange={e=>setHero(e.target.value)} placeholder="Abaddon" />
        </label>
        <label>Rol<br/>
          <select value={role} onChange={e=>setRole(e.target.value)}>
            { ["Mid","Offlane","Hard Carry","Support","Hard Support"].map(r => <option key={r} value={r}>{r}</option>) }
          </select>
        </label>
      </div>
      <label>Enemigos (5, separados por coma)<br/>
        <input value={enemiesText} onChange={e=>setEnemies(e.target.value.split(",").map(s=>s.trim()))} />
      </label>
      <label>Restricciones (opcional)<br/>
        <input value={constraints} onChange={e=>setConstraints(e.target.value)} placeholder="evitar Radiance, priorizar utilidad" />
      </label>
      <div style={{marginTop:12}}>
        <button type="submit">Enviar /init</button>
      </div>
    </form>
  );
}

function TickForm({ onResponse }) {
  const [minute, setMinute] = useState(10);
  const [level, setLevel] = useState(6);
  const [gold, setGold] = useState(900);
  const [k, setK] = useState(1);
  const [d, setD] = useState(2);
  const [a, setA] = useState(3);
  const [items, setItems] = useState(["Boots"]);
  const [netdiff, setNetdiff] = useState(-1500);
  const [xpdiff, setXpdiff] = useState(-800);

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      minute,
      my_status: { level, gold, kda: { k:Number(k), d:Number(d), a:Number(a) }, items },
      team_econ: { networth_diff: Number(netdiff), xp_diff: Number(xpdiff) }
    };
    try {
      const r = await fetch(`${API}/tick`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      const json = await r.json();
      onResponse(json);
    } catch (err) { onResponse({ error: String(err) }); }
  };

  return (
    <form className="card" onSubmit={submit}>
      <h2>Actualización en vivo</h2>
      <div className="row">
        <label>Minuto<br/>
          <input type="number" value={minute} onChange={e=>setMinute(Number(e.target.value))} />
        </label>
        <label>Nivel<br/>
          <input type="number" value={level} onChange={e=>setLevel(Number(e.target.value))} />
        </label>
        <label>Oro<br/>
          <input type="number" value={gold} onChange={e=>setGold(Number(e.target.value))} />
        </label>
        <label>K/D/A<br/>
          <div className="row">
            <input type="number" value={k} onChange={e=>setK(Number(e.target.value))} placeholder="K" />
            <input type="number" value={d} onChange={e=>setD(Number(e.target.value))} placeholder="D" />
            <input type="number" value={a} onChange={e=>setA(Number(e.target.value))} placeholder="A" />
          </div>
        </label>
      </div>
      <label>Items (separados por coma)<br/>
        <input value={items.join(", ")} onChange={e=>setItems(e.target.value.split(",").map(s=>s.trim()).filter(Boolean))} />
      </label>
      <div className="row">
        <label>Networth diff<br/>
          <input type="number" value={netdiff} onChange={e=>setNetdiff(Number(e.target.value))} />
        </label>
        <label>XP diff<br/>
          <input type="number" value={xpdiff} onChange={e=>setXpdiff(Number(e.target.value))} />
        </label>
      </div>
      <div style={{marginTop:12}}>
        <button type="submit">Enviar /tick</button>
      </div>
    </form>
  );
}

function App() {
  const [initResp, setInitResp] = useState(null);
  const [tickResp, setTickResp] = useState(null);

  return (
    <div>
      <InitForm onResponse={setInitResp} />
      {initResp && <JsonBlock title="Respuesta /init" data={initResp} />}
      <TickForm onResponse={setTickResp} />
      {tickResp && <JsonBlock title="Respuesta /tick" data={tickResp} />}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);