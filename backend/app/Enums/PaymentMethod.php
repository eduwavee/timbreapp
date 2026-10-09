<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Cash = 'efectivo';
    case Transfer = 'transferencia';
    case MercadoPago = 'mercadopago';
    case Other = 'otro';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Efectivo',
            self::Transfer => 'Transferencia',
            self::MercadoPago => 'Mercado Pago',
            self::Other => 'Otro',
        };
    }
}
