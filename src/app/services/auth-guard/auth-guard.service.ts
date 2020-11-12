import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AuthGuard {

    constructor(private authService: AuthService,
                private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, 
                state: RouterStateSnapshot) {
        return this.authService.isLoggedIn().then(
            ()=>{
                return true;
            },
            ()=>{
                this.router.navigate(['login']);
                return false;
            }
        );
    }
}