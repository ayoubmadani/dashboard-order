import React from 'react';
import { useParams } from 'react-router-dom';
import {PixelManager} from '../../../components/PixelManager'

const Pixels = () => {
  const storeId = localStorage.getItem('storeId')

  return (
    <PixelManager storeId={storeId} />
  );
};

export default Pixels;