import React from 'react';
import { AppShell } from '../auramind/AppShell';

interface Props {
  children: React.ReactNode;
}

export default function PageShell({ children }: Props) {
  return <AppShell>{children}</AppShell>;
}
