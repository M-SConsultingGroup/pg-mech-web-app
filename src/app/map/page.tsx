'use client';

import dynamic from 'next/dynamic';

const TicketMap = dynamic(() => import('@/components/TicketMap'), { ssr: false });

export default function MapPage() {
	return <TicketMap />;
}
