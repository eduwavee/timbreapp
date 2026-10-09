<?php

namespace App\Enums;

enum ProofStatus: string
{
    case Pending = 'pendiente';
    case Approved = 'aprobado';
    case Rejected = 'rechazado';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Para confirmar',
            self::Approved => 'Confirmado',
            self::Rejected => 'Rechazado',
        };
    }
}
