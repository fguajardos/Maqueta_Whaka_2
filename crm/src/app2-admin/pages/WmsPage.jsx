import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const CRM_URL = 'http://localhost:5173';

export default function WmsPage() {
    const { view } = useParams();
    const { wmsToken, wmsUser } = useAuth();
    const currentView = view || 'dashboard';

    // Construir URL del iframe con token para auto-auth y crm_url para links correctos
    const buildIframeSrc = () => {
        const params = new URLSearchParams({
            embedded: 'true',
            crm_url: CRM_URL,
        });
        if (wmsToken) {
            params.set('token', wmsToken);
        }
        if (wmsUser) {
            params.set('user', encodeURIComponent(JSON.stringify(wmsUser)));
        }
        return `http://localhost:3000/?${params.toString()}#${currentView}`;
    };

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
            <iframe
                key={`${currentView}-${wmsToken}`}
                src={buildIframeSrc()}
                title="WhakaChile WMS"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block'
                }}
            />
        </div>
    );
}
