import React, { lazy } from 'react';
import { motion } from 'framer-motion';
import { Product } from '../../types';
interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}
export function ProductCard({ product, onAdd }: ProductCardProps) {
  const isOutOfStock = product.stock === 0;
  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        scale: 0.9
      }}
      animate={{
        opacity: 1,
        scale: 1
      }}
      exit={{
        opacity: 0,
        scale: 0.9
      }}
      whileHover={
      !isOutOfStock ?
      {
        y: -4
      } :
      {}
      }
      whileTap={
      !isOutOfStock ?
      {
        scale: 0.98
      } :
      {}
      }
      onClick={() => !isOutOfStock && onAdd(product)}
      className={`bg-white rounded-2xl p-3 border border-slate-100 shadow-sm transition-shadow ${isOutOfStock ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-md hover:border-indigo-100'}`}>
      
      <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-3">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy" />
        
        {isOutOfStock &&
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-slate-900 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        }
      </div>
      <div className="px-1">
        <h3 className="font-medium text-slate-900 text-sm truncate">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-indigo-600 font-semibold">
            ${product.price.toFixed(2)}
          </span>
          {!isOutOfStock &&
          <span className="text-xs text-slate-400">{product.stock} left</span>
          }
        </div>
      </div>
    </motion.div>);

}