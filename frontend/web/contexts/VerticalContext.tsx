'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
// import { organisationService } from '../services/organisation.service'; 
// Note: We'll use the user's organisation config in the future. 
// For now we'll simulate enabled verticals based on the user's org.

export type VerticalType = 'core' | 'office' | 'campus' | 'network';

interface VerticalContextType {
    activeVertical: VerticalType;
    setActiveVertical: (vertical: VerticalType) => void;
    enabledVerticals: VerticalType[];
    isLoading: boolean;
}

const VerticalContext = createContext<VerticalContextType | undefined>(undefined);

export function VerticalProvider({ children }: { children: React.ReactNode }) {
    const [activeVertical, setActiveVertical] = useState<VerticalType>('core');
    const [enabledVerticals] = useState<VerticalType[]>(['core', 'office', 'campus', 'network']);
    const [isLoading] = useState(false);

    const value = {
        activeVertical,
        setActiveVertical,
        enabledVerticals,
        isLoading
    };

    return (
        <VerticalContext.Provider value={value}>
            {children}
        </VerticalContext.Provider>
    );
}

export function useVertical() {
    const context = useContext(VerticalContext);
    if (context === undefined) {
        throw new Error('useVertical must be used within a VerticalProvider');
    }
    return context;
}
