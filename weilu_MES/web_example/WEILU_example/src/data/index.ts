import { equipmentModule } from './modules/equipment'
import { interfacesModule } from './modules/interfaces'
import { ordersModule } from './modules/orders'
import { productionModule } from './modules/production'
import { productsModule } from './modules/products'
import { qualityModule } from './modules/quality'
import { scheduleModule } from './modules/schedule'
import { warehouseModule } from './modules/warehouse'
import type { ModuleConfig } from '../types'

export const modules: ModuleConfig[] = [
  ordersModule,
  scheduleModule,
  productionModule,
  warehouseModule,
  productsModule,
  qualityModule,
  equipmentModule,
  interfacesModule,
]

export const moduleMap: Record<string, ModuleConfig> = Object.fromEntries(
  modules.map((module) => [module.id, module]),
)

export * from './dashboard'
export * from './trace'
