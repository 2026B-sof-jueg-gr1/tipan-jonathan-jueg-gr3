/**
 * Catálogo de mejoras comprables con monedas.
 *
 * El coste de subir del nivel N al N+1 es `baseCost + costStep * N`, de modo que
 * cada mejora se encarece progresivamente. `effectPerLevel` describe el efecto
 * real aplicado en GameScene (ver `getStartingCrowdBonus` y `getCoinBonusLevel`).
 */
export const UPGRADES = Object.freeze([
  Object.freeze({
    id: 'startingCrowd',
    name: 'Refuerzos iniciales',
    description: 'Empiezas cada partida con más integrantes en la multitud.',
    effectLabel: '+5 integrantes por nivel',
    maxLevel: 5,
    baseCost: 50,
    costStep: 50,
    effectPerLevel: 5,
    color: 0x2ee6a8,
  }),
  Object.freeze({
    id: 'coinBonus',
    name: 'Bonificación de monedas',
    description: 'Aumenta las monedas obtenidas al completar un nivel.',
    effectLabel: '+20 % de recompensa por nivel',
    maxLevel: 5,
    baseCost: 75,
    costStep: 75,
    effectPerLevel: 0.2,
    color: 0xffc93c,
  }),
]);

/** Coste de la siguiente compra para una mejora que ya tiene `currentLevel`. */
export function upgradeCost(upgrade, currentLevel) {
  if (!upgrade) return Infinity;
  const level = Math.max(0, Math.floor(Number(currentLevel) || 0));
  return upgrade.baseCost + upgrade.costStep * level;
}

/** Devuelve la definición de una mejora por id (o null). */
export function getUpgrade(upgradeId, catalog = UPGRADES) {
  return catalog.find((upgrade) => upgrade.id === upgradeId) ?? null;
}
