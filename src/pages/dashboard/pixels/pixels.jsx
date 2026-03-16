import React from 'react';
import { useParams } from 'react-router-dom';
import {PixelManager} from '../../../components/PixelManager'

const Pixels = () => {
  const storeId = localStorage.getItem('storeId')

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <PixelManager storeId={storeId} />
    </div>
  );
};

export default Pixels;