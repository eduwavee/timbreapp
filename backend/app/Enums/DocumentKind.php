<?php

namespace App\Enums;

enum DocumentKind: string
{
    case Contract = 'contrato';
    case Id = 'dni';
    case Guarantee = 'garantia';
    case Payslip = 'recibo_sueldo';
    case Insurance = 'seguro';
    case Other = 'otro';

    public function label(): string
    {
        return match ($this) {
            self::Contract => 'Contrato firmado',
            self::Id => 'DNI',
            self::Guarantee => 'Garantía',
            self::Payslip => 'Recibo de sueldo',
            self::Insurance => 'Seguro',
            self::Other => 'Otro',
        };
    }
}
