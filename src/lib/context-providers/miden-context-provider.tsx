'use client'

import React, { PropsWithChildren, createContext, useContext, useEffect } from 'react'
import init from 'miden-wasm'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface MidenContextProps {}

export const MidenContext = createContext<MidenContextProps>({})

export const MidenContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
	useEffect(() => {
		init()
			.then(() => {
				console.log('WASM initialized successfully')
			})
			.catch((error: unknown) => {
				console.error('Failed to initialize WASM:', error)
			})
	}, [])

	return <MidenContext.Provider value={{}}>{children}</MidenContext.Provider>
}

export const useMiden = () => {
	const context = useContext(MidenContext)
	if (!context) {
		throw new Error('useMiden must be used within a MidenContextProvider')
	}
	return context
}
