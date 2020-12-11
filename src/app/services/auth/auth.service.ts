declare const gapi: any;
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NotesDataService } from '../notes-data/notes-data.service';


@Injectable()
export class AuthService {
    constructor(private router: Router,
        private notesDataService: NotesDataService,
        private httpClient: HttpClient) {
        gapi.load('auth2', function () {
            gapi.auth2.init();
        });
    }

    getIdToken() {
        return localStorage.getItem('id_token');
    }

    isLoggedIn() {
        let id_token = localStorage.getItem('id_token');
        return new Promise((resolve, reject) => {
            if (id_token) {
                let endpoint = process.env.API_ROOT + '/api/tokensignin';
                let reqBody = { id_token: id_token };
                this.httpClient.post(endpoint, reqBody)
                    .toPromise()
                    .then(
                        res => { // Success
                            resolve();
                        },
                        err => {
                            reject();
                        }
                    );
            } else {
                reject();
            }
        });
    }

    login() {
        let googleAuth = gapi.auth2.getAuthInstance();
        googleAuth.then(() => {
            googleAuth.signIn({ scope: 'profile email' }).then(googleUser => {
                var id_token = googleUser.getAuthResponse().id_token;
                localStorage.setItem('id_token', id_token);
                this.router.navigate(['']).then(() => {
                    window.location.reload();
                });
            });
        });
    }

    logout() {
        var googleAuth = gapi.auth2.getAuthInstance();
        googleAuth.signOut().then(() => {
            localStorage.removeItem('id_token');
            this.router.navigate(['login']);
              
        });
    }
}