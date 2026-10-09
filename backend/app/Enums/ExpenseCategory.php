<?php

namespace App\Enums;

enum ExpenseCategory: string
{
    case Repair = 'arreglo';
    case Abl = 'abl';
    case Fees = 'expensas';
    case Insurance = 'seguro';
    case Tax = 'impuesto';
    case Utility = 'servicio';
    case Other = 'otro';

    public function label(): string
    {
        return match ($this) {
            self::Repair => 'Arreglo',
            self::Abl => 'ABL',
            self::Fees => 'Expensas',
            self::Insurance => 'Seguro',
            self::Tax => 'Impuesto',
            self::Utility => 'Servicio',
            self::Other => 'Otro',
        };
    }
}
