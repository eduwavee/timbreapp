<?php

namespace App\Enums;

enum InquiryStatus: string
{
    case New = 'nueva';
    case InProgress = 'atendiendo';
    case Derived = 'derivada';
    case Closed = 'cerrada';

    public function label(): string
    {
        return match ($this) {
            self::New => 'Nueva',
            self::InProgress => 'La atendés vos',
            self::Derived => 'Derivada',
            self::Closed => 'Cerrada',
        };
    }
}
