<?php

namespace App\Enums;

enum InstallmentStatus: string
{
    case Pending = 'pendiente';
    case Partial = 'parcial';
    case Overdue = 'vencida';
    case Paid = 'pagada';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pendiente',
            self::Partial => 'Parcial',
            self::Overdue => 'Vencida',
            self::Paid => 'Pagada',
        };
    }
}
