import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Download, Upload, RotateCcw, Cloud, RefreshCw, LogOut, Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { entrar, obterConfig, sair, salvarConfig, sincronizar, usuario, type ResultadoSync } from '../db/sync'
import { FUNCOES, AVISO_ALIMENTOS, provedorAtual } from '../lib/ia'
import { db } from '../db/schema'
import { baixar, exportarTudo, importarTudo } from '../db/backup'
import { definirAjuste, useAjuste } from '../db/settings'
import { useToast } from '../ui/toast'

export default function Ajustes() {
  const toast = useToast()
  const input = useRef<HTMLInputElement>(null)
  const [ocupado, setOcupado] = useState(false)
  const destaque = useAjuste<string | undefined>('destaque', undefined)
  const contagem = useLiveQuery(async () => ({
    esmaltes: await db.esmaltes.count(), referencias: await db.referencias.count(),
    notas: await db.notas.count(), arquivos: await db.arquivos.count(),
  }))
  const [uso, setUso] = useState<string>()
  useLiveQuery(async () => {
    const e = await navigator.storage?.estimate?.()
    if (e?.usage != null) setUso((e.usage / 1e6).toFixed(1) + ' MB')
  })

  async function exportar() {
    setOcupado(true)
    try {
      const b = await exportarTudo()
      baixar(b, `atelie-backup-${new Date().toISOString().slice(0, 10)}.json`)
      await definirAjuste('ultimoBackup', Date.now())
      toast('Backup exportado')
    } finally { setOcupado(false) }
  }
  async function importar(f?: File) {
    if (!f) return
    setOcupado(true)
    try { const n = await importarTudo(f); toast(`${n} itens importados`) }
    catch (e) { toast((e as Error).message || 'Não foi possível importar') }
    finally { setOcupado(false) }
  }
  const ultimo = useAjuste<number | undefined>('ultimoBackup', undefined)

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <p className="eyebrow">Ajustes</p>
      <h1 style={{ marginTop: 8 }}>Mar de Lama</h1>

      <Nuvem />

      <section style={{ marginTop: 40 }}>
        <h3>Backup</h3>
        <p className="muted" style={{ marginTop: 6 }}>Um único arquivo com todos os dados, fotos e documentos. Importar um backup mescla com o que já existe, mantendo a versão mais recente de cada item.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
          <button className="btn primary" disabled={ocupado} onClick={exportar}><Download size={16} strokeWidth={1.5} />Exportar backup</button>
          <button className="btn" disabled={ocupado} onClick={() => input.current?.click()}><Upload size={16} strokeWidth={1.5} />Importar backup</button>
          <input ref={input} type="file" accept="application/json,.json" hidden onChange={(e) => { importar(e.target.files?.[0]); e.target.value = '' }} />
        </div>
        <p className="faint" style={{ fontSize: 13, marginTop: 12 }}>
          {ultimo ? `Último backup: ${new Date(ultimo).toLocaleString('pt-BR')}` : 'Nenhum backup exportado ainda.'}
          {contagem && ` · ${contagem.esmaltes} esmaltes, ${contagem.referencias} referências, ${contagem.notas} anotações, ${contagem.arquivos} arquivos`}
          {uso && ` · ${uso} em uso`}
        </p>
      </section>

      <section style={{ marginTop: 40 }}>
        <h3>Tela inicial</h3>
        <div style={{ marginTop: 14 }}>
          <button className="btn" disabled={!destaque} onClick={async () => {
            if (destaque) await db.arquivos.delete(destaque)
            await db.ajustes.delete('destaque'); toast('Imagem de destaque restaurada')
          }}><RotateCcw size={16} strokeWidth={1.5} />Restaurar imagem de destaque original</button>
        </div>
      </section>

      <section style={{ marginTop: 40 }}>
        <h3 style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Sparkles size={20} strokeWidth={1.3} />Inteligência artificial</h3>
        <p className="muted" style={{ marginTop: 6 }}>{provedorAtual() ? `Conectada: ${provedorAtual()!.nome}.` : 'O app está preparado para estas funções, que aparecerão nas telas indicadas quando um serviço de IA for conectado. Nenhuma está ativa ainda.'}</p>
        <div className="lista" style={{ marginTop: 10 }}>
          {FUNCOES.map((f) => <div key={f.id} className="row" style={{ gridTemplateColumns: '1fr auto' }}><div><div style={{ fontSize: 14.5 }}>{f.nome}</div><div className="s">{f.desc}</div></div><span className="faint" style={{ fontSize: 12 }}>{f.onde}</span></div>)}
        </div>
        <p className="aviso" style={{ marginTop: 14 }}>As respostas serão apresentadas como análises, separando o que é verificado (seus dados e cálculos) do que é hipótese ou sugestão experimental. {AVISO_ALIMENTOS}</p>
      </section>
    </div>
  )
}

function Nuvem() {
  const toast = useToast()
  const [url, setUrl] = useState(''); const [chave, setChave] = useState(''); const [email, setEmail] = useState('')
  const [user, setUser] = useState<string | null>(null); const [config, setConfig] = useState(false); const [ocupado, setOcupado] = useState(false)
  const ultimo = useAjuste<ResultadoSync | undefined>('sync.ultimo', undefined)
  const atualizar = async () => { const c = await obterConfig(); setConfig(!!c); if (c) { setUrl(c.url); setChave(c.chave) }; setUser((await usuario())?.email ?? null) }
  useEffect(() => { atualizar() }, [])
  const passo = async (f: () => Promise<unknown>, ok: string) => { setOcupado(true); try { await f(); toast(ok); await atualizar() } catch (e) { toast((e as Error).message) } finally { setOcupado(false) } }

  return (
    <section style={{ marginTop: 40 }}>
      <h3>Sincronização</h3>
      <div className="card" style={{ padding: 20, marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 14 }}>
          <Cloud size={22} strokeWidth={1.3} style={{ flexShrink: 0, marginTop: 2 }} />
          <p className="muted">{user ? `Conectado como ${user}. Seus dados sincronizam entre os aparelhos e continuam disponíveis sem internet.` : 'Tudo fica guardado neste aparelho e funciona sem internet. Conecte a sua conta na nuvem para sincronizar celular, tablet e computador.'}</p>
        </div>
        {user ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn sm primary" disabled={ocupado} onClick={() => passo(async () => { const r = await sincronizar(); toast(`${r.enviados} enviados, ${r.recebidos} recebidos`) }, 'Sincronizado')}><RefreshCw size={14} />Sincronizar agora</button>
            <button className="btn sm ghost" onClick={() => passo(sair, 'Você saiu da conta')}><LogOut size={14} />Sair</button>
            {ultimo && <span className="faint" style={{ fontSize: 12.5 }}>Última: {new Date(ultimo.quando).toLocaleString('pt-BR')}</span>}
          </div>
        ) : config ? (
          <form style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} onSubmit={(e) => { e.preventDefault(); passo(() => entrar(email), 'Enviamos um link de acesso para o seu e-mail') }}>
            <input className="input" type="email" required placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
            <button className="btn primary" disabled={ocupado}>Receber link de acesso</button>
          </form>
        ) : null}
        <details>
          <summary className="faint" style={{ fontSize: 13, cursor: 'pointer' }}>Conexão com o Supabase</summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            <input className="input" placeholder="Project URL (https://….supabase.co)" value={url} onChange={(e) => setUrl(e.target.value.trim())} />
            <input className="input" placeholder="anon key" value={chave} onChange={(e) => setChave(e.target.value.trim())} />
            <div><button className="btn sm" disabled={!url.startsWith('https://') || chave.length < 20} onClick={() => passo(() => salvarConfig({ url, chave }), 'Conexão salva')}>Salvar conexão</button></div>
          </div>
        </details>
      </div>
    </section>
  )
}
