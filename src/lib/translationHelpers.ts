// Translation helpers for dynamic database values
import { TranslationFunction } from './i18n';

/**
 * Translate risk levels
 */
export const translateRiskLevel = (t: TranslationFunction, risk: string): string => {
  const riskMap: { [key: string]: string } = {
    'low': t('low'),
    'faible': t('low'),
    'medium': t('medium'),
    'moyen': t('medium'),
    'high': t('high'),
    'élevé': t('high'),
    'critical': t('critical'),
    'critique': t('critical'),
  };
  return riskMap[risk?.toLowerCase()] || risk;
};

/**
 * Translate exploitation modes
 */
export const translateExploitationMode = (t: TranslationFunction, mode: string): string => {
  const modeMap: { [key: string]: string } = {
    'artisanal': t('artisanal'),
    'semi-mechanized': t('semiMechanized'),
    'semi-mécanisé': t('semiMechanized'),
    'industrial': t('industrial'),
    'industriel': t('industrial'),
  };
  return modeMap[mode?.toLowerCase()] || mode;
};

/**
 * Translate guardian tiers
 */
export const translateGuardianTier = (t: TranslationFunction, tier: string): string => {
  const tierMap: { [key: string]: string } = {
    'bronze': t('bronze'),
    'silver': t('silver'),
    'argent': t('silver'),
    'gold': t('gold_tier'),
    'or': t('gold_tier'),
    'platinum': t('platinum'),
    'platine': t('platinum'),
    'diamond': t('diamond_tier'),
    'diamant': t('diamond_tier'),
  };
  return tierMap[tier?.toLowerCase()] || tier;
};

/**
 * Translate NFT category names
 */
export const translateCategoryName = (t: TranslationFunction, name: string): string => {
  const categoryMap: { [key: string]: string } = {
    'Biodiversité': t('biodiversity'),
    'Biodiversity': t('biodiversity'),
    'Mangroves': t('mangroves'),
    'Faune Sauvage': t('wildlife'),
    'Wildlife': t('wildlife'),
    'Forêts': t('forests'),
    'Forests': t('forests'),
    'Animaux': t('animals'),
    'Animals': t('animals'),
    'Grandes plaines': t('greatPlains'),
    'Great Plains': t('greatPlains'),
    'Faune en danger': t('endangeredFauna'),
    'Endangered Fauna': t('endangeredFauna'),
    'Cours d\'eau': t('waterways'),
    'Waterways': t('waterways'),
    'Zones protégées': t('protectedAreas'),
    'Protected Areas': t('protectedAreas'),
    'Parcs nationaux': t('nationalParks'),
    'National Parks': t('nationalParks'),
  };
  return categoryMap[name] || name;
};

/**
 * Translate proposal status
 */
export const translateProposalStatus = (t: TranslationFunction, status: string): string => {
  const statusMap: { [key: string]: string } = {
    'active': t('active'),
    'actif': t('active'),
    'passed': t('passed'),
    'adoptée': t('passed'),
    'rejected': t('rejected'),
    'rejetée': t('rejected'),
    'executed': t('executed'),
    'exécutée': t('executed'),
    'pending': t('pending'),
    'en attente': t('pending'),
    'completed': t('completed'),
    'complété': t('completed'),
    'failed': t('failed'),
    'échoué': t('failed'),
  };
  return statusMap[status?.toLowerCase()] || status;
};

/**
 * Translate payment method types
 */
export const translatePaymentMethodType = (t: TranslationFunction, type: string): string => {
  const typeMap: { [key: string]: string } = {
    'crypto': t('cryptocurrency'),
    'cryptomonnaie': t('cryptocurrency'),
    'mobile_money': t('mobileMoney'),
    'mobile money': t('mobileMoney'),
    'bank_transfer': t('bankTransfer'),
    'transfert bancaire': t('bankTransfer'),
    'card': t('cardPayment'),
    'carte': t('cardPayment'),
    'cash': t('cashPayment'),
    'espèces': t('cashPayment'),
  };
  return typeMap[type?.toLowerCase()] || type;
};

/**
 * Translate notification types
 */
export const translateNotificationType = (t: TranslationFunction, type: string): string => {
  const typeMap: { [key: string]: string } = {
    'activity': t('notificationType'),
    'activité': t('notificationType'),
    'news': t('news'),
    'actualités': t('news'),
    'transaction': t('transaction'),
    'alert': t('security'),
    'alerte': t('security'),
    'achievement': t('rewards'),
    'récompense': t('rewards'),
  };
  return typeMap[type?.toLowerCase()] || type;
};

/**
 * Translate transaction types
 */
export const translateTransactionType = (t: TranslationFunction, type: string): string => {
  const typeMap: { [key: string]: string } = {
    'deposit': t('deposit_type'),
    'dépôt': t('deposit_type'),
    'withdraw': t('withdraw_type'),
    'retrait': t('withdraw_type'),
    'swap': t('swap_type'),
    'échange': t('swap_type'),
    'transfer': t('transfer_type'),
    'transfert': t('transfer_type'),
    'staking': t('staking_type'),
    'stake': t('staking_type'),
    'reward': t('reward_type'),
    'récompense': t('reward_type'),
  };
  return typeMap[type?.toLowerCase()] || type;
};

/**
 * Translate commodity names
 */
export const translateCommodity = (t: TranslationFunction, commodity: string): string => {
  const commodityMap: { [key: string]: string } = {
    'or': t('gold'),
    'gold': t('gold'),
    'diamant': t('diamond'),
    'diamond': t('diamond'),
    'bauxite': t('bauxite'),
    'fer': t('iron'),
    'iron': t('iron'),
    'cuivre': t('copper'),
    'copper': t('copper'),
    'cobalt': t('cobalt'),
  };
  return commodityMap[commodity?.toLowerCase()] || commodity;
};
