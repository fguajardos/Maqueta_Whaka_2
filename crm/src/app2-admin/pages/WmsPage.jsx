import React from 'react';
import { useParams } from 'react-router-dom';

export default function WmsPage() {
    const { view } = useParams();
    const currentView = view || 'dashboard';

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
            <iframe
                key={currentView}
                src={`http://localhost:3000/?embedded=true#${currentView}`}
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
