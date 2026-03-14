/**
 * Tests — Componentes UI (CRM)
 * Verifica el renderizado y comportamiento de los componentes reutilizables.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Button from '../components/Button';
import Badge from '../components/Badge';

// ============================================================
// Button
// ============================================================
describe('Button', () => {
    it('renderiza el texto hijo', () => {
        render(<Button>Guardar</Button>);
        expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
    });

    it('type="button" por defecto', () => {
        render(<Button>Test</Button>);
        expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('acepta type="submit"', () => {
        render(<Button type="submit">Enviar</Button>);
        expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('llama onClick al hacer click', async () => {
        const handleClick = vi.fn();
        const user = userEvent.setup();
        render(<Button onClick={handleClick}>Click</Button>);

        await user.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disabled=true deshabilita el botón y no llama onClick', async () => {
        const handleClick = vi.fn();
        const user = userEvent.setup();
        render(<Button disabled onClick={handleClick}>Deshabilitado</Button>);

        const btn = screen.getByRole('button');
        expect(btn).toBeDisabled();
        await user.click(btn);
        expect(handleClick).not.toHaveBeenCalled();
    });

    it('loading=true deshabilita el botón', () => {
        render(<Button loading>Cargando</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('loading=true muestra ícono de carga (Loader2)', () => {
        render(<Button loading>Guardando</Button>);
        // Loader2 de lucide renderiza un SVG
        const btn = screen.getByRole('button');
        expect(btn.querySelector('svg')).not.toBeNull();
    });

    it('renderiza variante primary por defecto', () => {
        render(<Button>Primary</Button>);
        const btn = screen.getByRole('button');
        expect(btn).toBeInTheDocument();
    });

    it('renderiza variante danger', () => {
        render(<Button variant="danger">Eliminar</Button>);
        expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
    });

    it('renderiza variante secondary', () => {
        render(<Button variant="secondary">Cancelar</Button>);
        expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    });

    it('renderiza variante ghost', () => {
        render(<Button variant="ghost">Ghost</Button>);
        expect(screen.getByRole('button', { name: 'Ghost' })).toBeInTheDocument();
    });

    it('size sm aplica estilos diferentes a size lg', () => {
        const { rerender } = render(<Button size="sm">Texto</Button>);
        const smBtn = screen.getByRole('button');
        const smStyle = smBtn.getAttribute('style') || '';

        rerender(<Button size="lg">Texto</Button>);
        const lgBtn = screen.getByRole('button');
        const lgStyle = lgBtn.getAttribute('style') || '';

        // Los estilos inline son diferentes entre sm y lg
        expect(smStyle).not.toBe(lgStyle);
    });

    it('pasa props adicionales al elemento button', () => {
        render(<Button data-testid="my-btn" aria-label="botón custom">OK</Button>);
        const btn = screen.getByTestId('my-btn');
        expect(btn).toHaveAttribute('aria-label', 'botón custom');
    });
});

// ============================================================
// Badge
// ============================================================
describe('Badge', () => {
    it('renderiza el status capitalizado como texto por defecto', () => {
        render(<Badge status="nuevo" />);
        expect(screen.getByText('Nuevo')).toBeInTheDocument();
    });

    it('usa label personalizado si se proporciona', () => {
        render(<Badge status="nuevo" label="Lead Nuevo" />);
        expect(screen.getByText('Lead Nuevo')).toBeInTheDocument();
    });

    it('muestra "Desconocido" para status null/undefined', () => {
        render(<Badge />);
        expect(screen.getByText('Desconocido')).toBeInTheDocument();
    });

    it('label LABEL_MAP: en_preparacion → "En Preparación"', () => {
        render(<Badge status="en_preparacion" />);
        expect(screen.getByText('En Preparación')).toBeInTheDocument();
    });

    it('label LABEL_MAP: listo_bodega → "Listo Bodega"', () => {
        render(<Badge status="listo_bodega" />);
        expect(screen.getByText('Listo Bodega')).toBeInTheDocument();
    });

    it('label LABEL_MAP: credito_30 → "Crédito 30 días"', () => {
        render(<Badge status="credito_30" />);
        expect(screen.getByText('Crédito 30 días')).toBeInTheDocument();
    });

    it('label LABEL_MAP: no_configurado → "No Configurado"', () => {
        render(<Badge status="no_configurado" />);
        expect(screen.getByText('No Configurado')).toBeInTheDocument();
    });

    it('renderiza como elemento span', () => {
        render(<Badge status="activo" />);
        const badge = screen.getByText('Activo');
        expect(badge.tagName.toLowerCase()).toBe('span');
    });

    it('status incidencia tiene estilo de alerta (fondo rojo)', () => {
        render(<Badge status="incidencia" />);
        const badge = screen.getByText('Incidencia');
        const style = badge.getAttribute('style') || '';
        // jsdom convierte #FCA5A5 → rgb(252, 165, 165)
        expect(style).toContain('rgb(252, 165, 165)');
    });

    it('status entregado tiene estilo de éxito (fondo verde)', () => {
        render(<Badge status="entregado" />);
        const badge = screen.getByText('Entregado');
        const style = badge.getAttribute('style') || '';
        // jsdom convierte #BBF7D0 → rgb(187, 247, 208)
        expect(style).toContain('rgb(187, 247, 208)');
    });

    it('status desconocido usa colores fallback grises', () => {
        render(<Badge status="estado_que_no_existe" />);
        const badge = screen.getByText('Estado Que No Existe');
        const style = badge.getAttribute('style') || '';
        // jsdom convierte #F3F4F6 → rgb(243, 244, 246)
        expect(style).toContain('rgb(243, 244, 246)');
    });

    it('acepta size sm, md y lg', () => {
        const { rerender } = render(<Badge status="activo" size="sm" />);
        expect(screen.getByText('Activo')).toBeInTheDocument();

        rerender(<Badge status="activo" size="lg" />);
        expect(screen.getByText('Activo')).toBeInTheDocument();
    });

    it('convierte guiones bajos en espacios para status no mapeado', () => {
        render(<Badge status="estado_personalizado" />);
        expect(screen.getByText('Estado Personalizado')).toBeInTheDocument();
    });

    // Todos los status definidos en el sistema
    const allStatuses = [
        'nuevo', 'pendiente', 'aprobado', 'activo', 'observado', 'rechazado', 'bloqueado',
        'recibido', 'validado', 'facturado', 'despachado', 'entregado', 'incidencia',
    ];

    it.each(allStatuses)('renderiza status "%s" sin errores', (status) => {
        render(<Badge status={status} />);
        const badge = document.querySelector('span');
        expect(badge).not.toBeNull();
    });
});
