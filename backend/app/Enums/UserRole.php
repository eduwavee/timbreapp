<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Tenant = 'inquilino';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Administrador',
            self::Tenant => 'Inquilino',
        };
    }
}
