import { APIProvider } from '@vis.gl/react-google-maps';
import { GOOGLE_MAPS_API_KEY } from '../config/googleMaps';

const GoogleMapsProvider = ({ children }) => {
  return (
    <APIProvider
      apiKey={GOOGLE_MAPS_API_KEY}
      version="weekly"
      libraries={['marker']}
    >
      {children}
    </APIProvider>
  );
};

export default GoogleMapsProvider;
