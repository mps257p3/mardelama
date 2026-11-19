import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Download, Upload, RotateCcw, Cloud } from 'lucide-react'
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
      <h1 style={{ marginTop: 8 }}>Ateliê</h1>

      <section style={{ marginTop: 40 }}>
        <h3>Sincronização</h3>
        <div className="card" style={{ padding: 20, marginTop: 14, display: 'flex', gap: 14 }}>
          <Cloud size={22} strokeWidth={1.3} style={{ flexShrink: 0, marginTop: 2 }} />
          <p className="muted">Por enquanto tudo fica guardado neste aparelho e funciona sem internet. A conta na nuvem, com login e sincronização entre celular e computador, será ligada na próxima etapa.</p>
        </div>
      </section>

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
    </div>
  )
}
