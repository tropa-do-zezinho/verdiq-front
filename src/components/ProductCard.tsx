import { Link } from 'react-router-dom'
import type { ProductListItem } from '../api/types'
import { money, tons } from '../api/client'
import { SeasonBadge } from './SeasonBadge'
import styles from './ProductCard.module.css'

export function ProductCard({ product }: { product: ProductListItem }) {
  return (
    <Link to={`/produtos/${product.id}`} className={styles.card}>
      <div className={styles.top}>
        <div>
          <p className={styles.cat}>{product.categoria}</p>
          <h3 className={styles.name}>{product.nome}</h3>
        </div>
        <SeasonBadge selo={product.seloEpoca} />
      </div>
      <div className={styles.meta}>
        <span className={styles.price}>
          {money(product.precoAtacado)}
          {product.unidadeBase ? ` / ${product.unidadeBase.toLowerCase()}` : ''}
        </span>
        <span className={styles.fonte}>
          Preço: {product.fontePreco || '—'}
          {product.fonteProducao
            ? ` · Produção SP ${product.producaoAno}: ${tons(product.producaoSpT)} (${product.fonteProducao})`
            : ''}
        </span>
      </div>
    </Link>
  )
}
