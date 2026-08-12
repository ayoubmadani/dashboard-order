import React from 'react';
import { useTranslation } from 'react-i18next';
import { PixelManager } from '../../../components/PixelManager';
import NoStoreState from '../../../components/NoStoreState';

const Pixels = () => {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'Pixels' });
  const isRtl = i18n.dir() === 'rtl';
  const storeId = localStorage.getItem('storeId');

  if (!storeId) {
    return <NoStoreState title={t('noStorePage.title')} subtitle={t('noStorePage.subtitle')} cta={t('noStorePage.cta')} isRtl={isRtl} />;
  }

  return (
    <PixelManager storeId={storeId} />
  );
};

export default Pixels;
