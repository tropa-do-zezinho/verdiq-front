import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, money } from '../api/client'
import type { Plano } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import styles from './Home.module.css'

export function HomePage() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<Plano[]>([])
  const [interestMsg, setInterestMsg] = useState<string | null>(null)

  useEffect(() => {
    api<Plano[]>('/v1/plans', { auth: false })
      .then((list) => setPlans(list.filter((p) => p.ativo !== false)))
      .catch(() => setPlans([]))
  }, [])

  async function interest(codigo: string) {
    if (!user) {
      setInterestMsg('Entre na conta para registrar interesse no plano.')
      return
    }
    try {
      const res = await api<{ mensagem?: string; status?: string }>(`/v1/plans/${codigo}/interest`, {
        method: 'POST',
      })
      setInterestMsg(res.mensagem || `Interesse registrado (${res.status || 'ok'}).`)
    } catch {
      setInterestMsg('Não foi possível registrar o interesse agora.')
    }
  }

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden />
        <div className={styles.content}>
          <h1 className={styles.brandMark}>Verdiq</h1>
          <p className={styles.lead}>
            Saiba quando comprar e vender hortifruti — safra, preço de referência e menos desperdício.
          </p>
          <div className={styles.ctas}>
            <Link to="/cadastro" className="btn btn-primary">
              Começar grátis
            </Link>
            <Link to="/produtos" className="btn btn-secondary">
              Explorar catálogo
            </Link>
          </div>
        </div>
      </section>

      <section className={`container ${styles.section}`}>
        <div className={styles.sectionHead}>
          <h2>O projeto</h2>
          <p>
            O Verdiq é um calendário de safra para a cadeia de frutas, legumes e verduras (FLV). Cruzamos
            índices sazonais, preços de atacado de referência e dados de produção (IBGE/SIDRA) para orientar
            decisões no tempo certo — sem confundir cotação de Ceasa com preço de loja.
          </p>
        </div>
        <div className={styles.story}>
          <div className={styles.storyBlock}>
            <h3>O problema</h3>
            <p>
              Comprar fora de época encarece a banca e aumenta perda. Vender sem janela de oferta deixa
              mercadoria parada. Falta um sinal claro, local e explicável.
            </p>
          </div>
          <div className={styles.storyBlock}>
            <h3>A proposta</h3>
            <p>
              Selos de época, série de preços, calendário de 12 meses e recomendações para o comerciante —
              com fontes e confiança à vista. Ofertas de última chance ajudam a escoar lote maduro.
            </p>
          </div>
        </div>
      </section>

      <section className={`container ${styles.section}`}>
        <div className={styles.sectionHead}>
          <h2>Para quem</h2>
          <p>Três entradas no mesmo produto, cada uma com o fluxo que importa.</p>
        </div>
        <div className={styles.audience}>
          <div className={styles.audienceItem}>
            <h3>Cliente</h3>
            <p>Consulta o que está em safra, favorita produtos e monta listas de compra.</p>
          </div>
          <div className={styles.audienceItem}>
            <h3>Comerciante</h3>
            <p>ERP leve de compras, vendas e perdas, dashboard, import/export e ofertas.</p>
          </div>
          <div className={styles.audienceItem}>
            <h3>Operação</h3>
            <p>Admin dispara ETL, sobe planilha de preços e acompanha auditoria e impacto.</p>
          </div>
        </div>
      </section>

      <section className={`container ${styles.section}`} id="planos">
        <div className={styles.sectionHead}>
          <h2>Planos</h2>
          <p>
            Essencial gratuito para começar. PRO com recursos avançados — nesta entrega, registre interesse
            (sem cobrança online).
          </p>
        </div>
        {interestMsg && <div className="alert alert-info">{interestMsg}</div>}
        <div className={styles.plans}>
          {plans.length === 0 ? (
            <p className="muted">Planos indisponíveis no momento. Veja também a página Planos no menu.</p>
          ) : (
            plans.map((p) => (
              <article
                key={p.id}
                className={`${styles.plan} ${p.codigo === 'PRO' ? styles.planPro : ''}`}
              >
                <h3 className={styles.planName}>{p.nome}</h3>
                <p className={styles.planPrice}>
                  {Number(p.precoMensal) === 0 ? 'Grátis' : money(p.precoMensal)}
                  {Number(p.precoMensal) > 0 && <span> / mês</span>}
                </p>
                <p className={styles.planBenefits}>{p.beneficios}</p>
                {p.codigo === 'ESSENCIAL' ? (
                  <Link to="/cadastro" className="btn btn-secondary">
                    Criar conta
                  </Link>
                ) : (
                  <button type="button" className="btn btn-primary" onClick={() => interest(p.codigo)}>
                    Tenho interesse
                  </button>
                )}
              </article>
            ))
          )}
        </div>
      </section>

      <section className="container">
        <div className={styles.closing}>
          <h2>Compre e venda no tempo da safra</h2>
          <p>
            Abra o catálogo, veja o que está em época em SP ou entre com a conta seed para testar o ERP e o
            painel admin.
          </p>
          <div className={styles.ctas}>
            <Link to="/safra" className="btn btn-primary">
              Ver safra agora
            </Link>
            <Link to="/entrar" className="btn btn-secondary">
              Entrar
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
