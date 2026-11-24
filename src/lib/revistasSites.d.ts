export interface SiteRevista { nome: string; base: string; grupo: string; secao: 'ceramica' | 'ilustracao' | 'design' | 'internacional' | 'brasil' | 'japao'; tipo: 'ceramica' | 'ilustracao' | 'arte'; lingua?: 'pt' | 'ja'; recentes?: string[] }
export declare const SECOES: { id: SiteRevista['secao']; nome: string }[]
export declare const SITES: Record<string, SiteRevista>
export declare const SEM_CAMINHO: { nome: string; motivo: string }[]
