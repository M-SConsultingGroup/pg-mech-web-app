'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { saveScroll, restoreScroll } from '@/lib/scroll-manager';

export default function ScrollRestoration() {
	const pathname = usePathname();

	useEffect(() => {
		saveScroll(pathname);
		return () => {
			saveScroll(pathname);
		};
	}, [pathname]);

	useEffect(() => {
		restoreScroll(pathname);
	}, [pathname]);

	return null;
}