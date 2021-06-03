import tkinter as tk
import numpy as np
import matplotlib.pyplot as plt
import time

# TODO : le bout d'escorte qui poursuit l'ennemi doit l'encercler -> toujours un comportement d'escorte avec des k différents

DISTANCE_ATTRACTION = 90 # 90
DISTANCE_ALIGNEMENT = 60 # 60
DISTANCE_REPULSION = 55 # 55
DISTANCE_VOISIN = DISTANCE_ATTRACTION

DISTANCE_ENNEMI = 300
NB_MEME_AGRO = 6

K_ATTRACTION = 0.001 # 0.001
K_ALIGNEMENT = 1 # 1
K_REPULSION = 1000 # 1000

OBJECTIF_X = 2000
OBJECTIF_Y = -500
K_OBJECTIF = 0.1 # 0.1
K_OBJECTIF_ENN = 0.1

DISTANCE_POURSUITE_ATTRACTION = 50 # 90
DISTANCE_POURSUITE_ALIGNEMENT = 45 # 60
DISTANCE_POURSUITE_REPULSION = 45 # 40
DISTANCE_POURSUITE_VOISIN = DISTANCE_POURSUITE_ATTRACTION
K_POURSUITE_ATTRACTION = 0 # 0
K_POURSUITE_ALIGNEMENT = 0 # 0
K_POURSUITE_REPULSION = 1000 # 1000
K_POURSUITE_OBJECTIF = 1 # 1

MEGA_TIMER = 0
MEGA_TIMER_MAX = 60*60*15 # nb de tours de boucles avant arrêt

# TODO : vraiment séparer la 'cible' du reste, comportement différentié, ...

# X = x2-x1, Y = y2-y1
def distance_carre(X, Y) :
    return X*X + Y*Y

def normalise(x,y) :
    if x == 0 and y == 0 : # évite une division par 0
        return 0,0
    n = np.sqrt(x*x + y*y)
    return x/n, y/n

# t = [(x,y)] : tableau de positions
# p = [poids]
def barycentre(t, p) :
    x = 0
    y = 0
    N = len(t) # todo PB ICI : len(t) ou somme des poids ?

    for i in range(len(t)) :
        x += t[i][0]*p[i]
        y += t[i][1]*p[i]
        #N += p[i]
    
    return ( x/N, y/N )

def creer_cercle(canvas, x, y, r, color, **kwargs) :
    """Dessine le contour d'un cercle. Retourne un identifiant."""
    return canvas.create_oval((x-r, y-r, x+r, y+r), outline=color, **kwargs)

def creer_disque(canvas, x, y, r, color, **kwargs) :
    """Dessine un disque plein. Retourne un identifiant."""
    return canvas.create_oval((x-r, y-r, x+r, y+r), fill=color, **kwargs)

class Robot :
    def __init__(self, ind, x, y, r, canvas) :
        self.ind = ind # identifiant, index dans le tableau des robots
        self.str_ind = "robot" + str(ind)
        self.x = x # float pour la précision
        self.y = y
        self.r = r # rayon
        self.couleur = "red"
        self.v_max = 1.0 # vitesse max = sqrt(dx*dx + dy*dy)

        self.dir_x = np.random.rand() - 0.5 # direction (vecteur normé)
        self.dir_y = np.random.rand() - 0.5
        self.dir_x, self.dir_y = normalise(self.dir_x, self.dir_y)

        self.obj_x = OBJECTIF_X
        self.obj_y = OBJECTIF_Y

        self.est_la_cible = False
        self.poursuit_ennemi = -1

        self.cercle_att = creer_cercle(canvas, int(self.x), int(self.y), DISTANCE_ATTRACTION, "#7777ff", tags=(self.str_ind, "cercle", "elm"))
        self.cercle_ali = creer_cercle(canvas, int(self.x), int(self.y), DISTANCE_ALIGNEMENT, "#44cc44", tags=(self.str_ind, "cercle", "elm"))
        self.cercle_rep = creer_cercle(canvas, int(self.x), int(self.y), DISTANCE_REPULSION, "#ff7777", tags=(self.str_ind, "cercle", "elm"))

        self.disque_plein = creer_disque(canvas, int(self.x), int(self.y), self.r, self.couleur, tags=(self.str_ind, "disque", "elm"))
        self.ligne_dir = canvas.create_line(int(self.x),int(self.y),int(self.x+self.dir_x*self.r),int(self.y+self.dir_y*self.r), fill="black", tags=(self.str_ind, "ligne dir", "elm"))

    def mise_a_jour(self, interface) :
        dx = 0
        dy = 0
        dir_voulue_x = 0
        dir_voulue_y = 0

        if self.poursuit_ennemi == -1 :
            # distance carré
            voisins2, distances2 = interface.cherche_voisins(self.ind, self.x, self.y, DISTANCE_VOISIN)

            voisins, distances = [], []
            poursuite_voisins, poursuite_distances = [], []
            for i in range(len(voisins2)) :
                if voisins2[i].poursuit_ennemi == -1 :
                    voisins.append(voisins2[i])
                    distances.append(distances2[i])
                else :
                    poursuite_voisins.append(voisins2[i])
                    poursuite_distances.append(distances2[i])

            if len(voisins) != 0 :
                positions_att = [] # attraction
                poids_att = []
                positions_rep = [] # répulsion
                poids_rep = []
                
                dir_ali = []
                dir_ali_x = 0
                dir_ali_y = 0
                
                for i in range(len(voisins)) :
                    if distances[i] > DISTANCE_ALIGNEMENT*DISTANCE_ALIGNEMENT : # attraction
                        positions_att.append( normalise(voisins[i].x-self.x, voisins[i].y-self.y) )
                        poids_att.append(np.sqrt(distances[i]))
                    elif distances[i] > DISTANCE_REPULSION*DISTANCE_REPULSION : # alignement
                        dir_ali.append( normalise(voisins[i].dir_x, voisins[i].dir_y) ) # dir déjà normalisé, pas besoin de le faire à nouveau
                    else : # répulsion
                        positions_rep.append( normalise(voisins[i].x-self.x, voisins[i].y-self.y) )
                        poids_rep.append(1/(distances[i]))

                if len(positions_att) != 0 : # évite une possible division par zéro.
                    bar_att_x, bar_att_y = barycentre(positions_att, poids_att)
                    dir_voulue_x += K_ATTRACTION * bar_att_x
                    dir_voulue_y += K_ATTRACTION * bar_att_y

                if len(dir_ali) != 0 and not self.est_la_cible : # todo à remplacer par barycentre
                    for voisin_ali in dir_ali :
                        dir_ali_x += voisin_ali[0]
                        dir_ali_y += voisin_ali[1]
                    dir_ali_x /= len(dir_ali)
                    dir_ali_y /= len(dir_ali)

                    dir_voulue_x += K_ALIGNEMENT*dir_ali_x
                    dir_voulue_y += K_ALIGNEMENT*dir_ali_y
        
                if len(positions_rep) != 0 :
                    bar_rep_x, bar_rep_y = barycentre(positions_rep, poids_rep)
                    dir_voulue_x -= K_REPULSION * bar_rep_x
                    dir_voulue_y -= K_REPULSION * bar_rep_y

            if len(poursuite_voisins) != 0 :
                positions_rep = [] # répulsion
                poids_rep = []
                
                for i in range(len(poursuite_voisins)) :
                    if poursuite_distances[i] < DISTANCE_REPULSION*DISTANCE_REPULSION : # répulsion
                        positions_rep.append( normalise(poursuite_voisins[i].x-self.x, poursuite_voisins[i].y-self.y) )
                        poids_rep.append(1/(poursuite_distances[i]))

                if len(positions_rep) != 0 :
                    bar_rep_x, bar_rep_y = barycentre(positions_rep, poids_rep)
                    dir_voulue_x -= K_REPULSION * bar_rep_x
                    dir_voulue_y -= K_REPULSION * bar_rep_y

            dir_obj_x, dir_obj_y = normalise(self.obj_x - self.x, self.obj_y - self.y)
            if self.est_la_cible :
                dir_voulue_x += 4 * K_OBJECTIF * dir_obj_x
                dir_voulue_y += 4 * K_OBJECTIF * dir_obj_y
            else :
                dir_voulue_x += K_OBJECTIF * dir_obj_x
                dir_voulue_y += K_OBJECTIF * dir_obj_y

            n = np.sqrt(distance_carre(dir_voulue_x, dir_voulue_y))
            if self.est_la_cible :
                v = min(n, 0.5 * self.v_max) # le gros est 2x plus lent
            else :
                v = min(n, self.v_max)

            if n != 0 : # normalise
                self.dir_x = dir_voulue_x/n
                self.dir_y = dir_voulue_y/n
        else :
            # distance carré
            voisins2, distances2 = interface.cherche_voisins(self.ind, self.x, self.y, DISTANCE_POURSUITE_VOISIN)

            voisins, distances = [], []
            for i in range(len(voisins2)) :
                if voisins2[i].ind in interface.ennemis[self.poursuit_ennemi].dans_le_viseur :
                    voisins.append(voisins2[i])
                    distances.append(distances2[i])
            
            if len(voisins) != 0 :
                positions_att = [] # attraction
                poids_att = []
                positions_rep = [] # répulsion
                poids_rep = []
                
                dir_ali = []
                dir_ali_x = 0
                dir_ali_y = 0
                
                for i in range(len(voisins)) :
                    if distances[i] > DISTANCE_POURSUITE_ALIGNEMENT*DISTANCE_POURSUITE_ALIGNEMENT : # attraction
                        positions_att.append( normalise(voisins[i].x-self.x, voisins[i].y-self.y) )
                        poids_att.append(np.sqrt(distances[i]))
                    elif distances[i] > DISTANCE_POURSUITE_REPULSION*DISTANCE_POURSUITE_REPULSION : # alignement
                        dir_ali.append( normalise(voisins[i].dir_x, voisins[i].dir_y) ) # dir déjà normalisé, pas besoin de le faire à nouveau
                    else : # répulsion
                        positions_rep.append( normalise(voisins[i].x-self.x, voisins[i].y-self.y) )
                        poids_rep.append(1/(distances[i]))

                if len(positions_att) != 0 : # évite une possible division par zéro.
                    bar_att_x, bar_att_y = barycentre(positions_att, poids_att)
                    dir_voulue_x += K_POURSUITE_ATTRACTION * bar_att_x
                    dir_voulue_y += K_POURSUITE_ATTRACTION * bar_att_y

                if len(dir_ali) != 0 : # todo à remplacer par barycentre
                    for voisin_ali in dir_ali :
                        dir_ali_x += voisin_ali[0]
                        dir_ali_y += voisin_ali[1]
                    dir_ali_x /= len(dir_ali)
                    dir_ali_y /= len(dir_ali)

                    dir_voulue_x += K_POURSUITE_ALIGNEMENT*dir_ali_x
                    dir_voulue_y += K_POURSUITE_ALIGNEMENT*dir_ali_y
        
                if len(positions_rep) != 0 :
                    bar_rep_x, bar_rep_y = barycentre(positions_rep, poids_rep)
                    dir_voulue_x -= K_POURSUITE_REPULSION * bar_rep_x
                    dir_voulue_y -= K_POURSUITE_REPULSION * bar_rep_y            

            dir_obj_x, dir_obj_y = normalise(self.obj_x - self.x, self.obj_y - self.y)
            dir_voulue_x += K_POURSUITE_OBJECTIF * dir_obj_x
            dir_voulue_y += K_POURSUITE_OBJECTIF * dir_obj_y

            n = np.sqrt(distance_carre(dir_voulue_x, dir_voulue_y))
            v = min(n, self.v_max)

            if n != 0 : # normalise
                self.dir_x = dir_voulue_x/n
                self.dir_y = dir_voulue_y/n

##            dir_obj_x, dir_obj_y = normalise(self.obj_x - self.x, self.obj_y - self.y)
##            dir_voulue_x += K_OBJECTIF * dir_obj_x
##            dir_voulue_y += K_OBJECTIF * dir_obj_y
##            v = 10*self.v_max
##            self.dir_x = dir_voulue_x
##            self.dir_y = dir_voulue_y

        dx = v * self.dir_x
        dy = v * self.dir_y

        if interface.emplacement_valide(self.ind, self.x+dx, self.y+dy, self.r) :
            x_avant_int, y_avant_int = int(self.x), int(self.y)
            self.x += dx
            self.y += dy
            x_apres_int, y_apres_int = int(self.x), int(self.y)
            interface.canvas.move(self.str_ind, x_apres_int-x_avant_int, y_apres_int-y_avant_int)

            cx1, cy1, cx2, cy2 = interface.canvas.coords(self.disque_plein)
            cx, cy = (cx1+cx2)/2, (cy1+cy2)/2
            interface.canvas.coords(self.ligne_dir, cx, cy, cx+int(self.dir_x*self.r), cy+int(self.dir_y*self.r))

    def set_couleur(self, canvas, couleur) :
        canvas.itemconfigure(self.disque_plein, fill=couleur)
        self.couleur = couleur

class Ennemi:
    def __init__(self, ind, x, y, r, canvas):
        self.ind = ind
        self.str_ind = "ennemi" + str(ind)
        self.x = x # float
        self.y = y
        self.r = r
        self.v = 10
        self.couleur = 'purple'
        self.dir_x, self.dir_y = 1,0

        self.dans_le_viseur = [] # robots de l'escorte qui foncent sur lui

        self.obj_x, self.obj_y = 0,0

        self.disque_plein = creer_disque(canvas, int(self.x), int(self.y), self.r, self.couleur, tags=(self.str_ind, "disque", "elm"))
        self.ligne_dir = canvas.create_line(int(self.x),int(self.y),int(self.x+self.dir_x*self.r),int(self.y+self.dir_y*self.r), fill="black", tags=(self.str_ind, "ligne dir", "elm"))

    def mise_a_jour(self, interface):
        self.dir_x, self.dir_y = normalise(self.obj_x - self.x, self.obj_y - self.y)

        dx = self.v * K_OBJECTIF_ENN * self.dir_x
        dy = self.v * K_OBJECTIF_ENN * self.dir_y
        
        if interface.emplacement_valide(self.ind, self.x+dx, self.y+dy, self.r, 'ennemi') :
            x_avant_int, y_avant_int = int(self.x), int(self.y)
            self.x += dx
            self.y += dy
            x_apres_int, y_apres_int = int(self.x), int(self.y)
            interface.canvas.move(self.str_ind, x_apres_int-x_avant_int, y_apres_int-y_avant_int)

            cx1, cy1, cx2, cy2 = interface.canvas.coords(self.disque_plein)
            cx, cy = (cx1+cx2)/2, (cy1+cy2)/2
            interface.canvas.coords(self.ligne_dir, cx, cy, cx+int(self.dir_x*self.r), cy+int(self.dir_y*self.r))

class Interface(tk.Frame):
    def __init__(self, fenetre, w, h, fps):
        tk.Frame.__init__(self, fenetre, width = w, height = h)
        self.pack(fill=tk.BOTH)

        self.hauteur = h
        self.largeur = w

        self.fps = fps # nombre de mises à jour maximum par seconde
        self.dt = int(1000/self.fps) # delai minimum entre chaque mise à jour en millisecondes

        # canvas

        self.canvas = tk.Canvas(self, width=w, height=h, background='white')
        self.canvas.bind('<Button-1>', self.clic_sur_la_fenetre)
        fenetre.bind('<Return>', self.suit_autre_robot) # touche entrée
        fenetre.bind('<Key-p>', self.suit_aucun_robot)
        for i in range(1,10) :
            fenetre.bind(str(i), self.touche_pressee)

        # grille
        
        self.grille = []
        self.largeur_grille = 100
        self.offset_origine_x, self.offset_origine_y = 0,0 # position de la camera par rapport à l'origine (0,0)
        self.offset_grille_x, self.offset_grille_y = 0,0 # position de la grille par rapport à la camera

        self.obj_disque = creer_disque(self.canvas, OBJECTIF_X, OBJECTIF_Y, 5, "green", tags=("elm"))

        # affiche la position de la camera
        self.label_x = self.canvas.create_text((10,10), text="x: 0", anchor='nw')        
        self.label_y = self.canvas.create_text((10,30), text="y: 0", anchor='nw')

        for i in range(0,self.largeur,self.largeur_grille) :
            self.grille.append(self.canvas.create_line(i,-self.largeur_grille,i,self.hauteur, fill="grey", tags=("grille", "elm")))
        
        for j in range(0,self.hauteur,self.largeur_grille) :
            self.grille.append(self.canvas.create_line(-self.largeur_grille,j,self.largeur,j, fill="grey", tags=("grille", "elm")))

        # robots

        self.nb_robots = 40
        self.robots = []
        self.dist_robots = np.zeros((self.nb_robots, self.nb_robots)) # distance au carré entre les robots, rempli pour i<j.
        self.robot_a_suivre = -1

        self.nb_ennemis = 1
        self.ennemis = []
        self.dist_ennemis = np.zeros((self.nb_ennemis,self.nb_ennemis))
        self.ennemis.append(Ennemi(0,OBJECTIF_X, OBJECTIF_Y,10, self.canvas))
        #self.ennemis.append(Ennemi(1,2*(w-50),150,10, self.canvas)) # /!\ index
        self.dist_ennemis_robots = np.zeros((self.nb_ennemis, self.nb_robots))

        self.robots.append(Robot(0, 10+(w-10-10)/2, 10+(h-10-10)/2, 20, self.canvas))
        i = 1
        while i < self.nb_robots :
            x = np.random.randint(10,w-10)
            y = np.random.randint(10,h-10)
            r = 10
            if i == 0 :
                r = 20
            if self.emplacement_valide(-1, x, y, r) :
                self.robots.append(Robot(i, x, y, r, self.canvas))
                i += 1
        self.robots[0].est_la_cible = True

        self.canvas.tag_raise("disque", "cercle")
        self.canvas.tag_raise("ligne dir", "disque")
        
        self.canvas.pack()

    def mise_a_jour(self) : # boucle principale
        """Boucle exécutée pour passer à l'état suivant de la simulation."""
        global MEGA_TIMER

        for i in range(len(self.ennemis)) :
            self.ennemis[i].obj_x, self.ennemis[i].obj_y = self.robots[0].x, self.robots[0].y
            self.ennemis[i].mise_a_jour(self)
            for j in range(i+1, self.nb_ennemis):
                self.dist_ennemis[i][j] = distance_carre(self.ennemis[i].x - self.ennemis[j].x, self.ennemis[i].y - self.ennemis[j].y)
            for j in range(self.nb_robots) :
                self.dist_ennemis_robots[i][j] = distance_carre(self.ennemis[i].x - self.robots[j].x, self.ennemis[i].y - self.robots[j].y)

        for i in range(self.nb_robots) :
            for j in range(i+1, self.nb_robots) :
                self.dist_robots[i][j] = distance_carre(self.robots[j].x - self.robots[i].x, self.robots[j].y - self.robots[i].y)
            if i != 0 :
                self.robots[i].obj_x, self.robots[i].obj_y = self.robots[0].x, self.robots[0].y
                if self.robots[i].poursuit_ennemi == -1 :
                    for j in range(len(self.ennemis)):
                        if self.dist_ennemis_robots[j][i] < DISTANCE_ENNEMI*DISTANCE_ENNEMI :
                            if len(self.ennemis[j].dans_le_viseur) < NB_MEME_AGRO :
                                self.ennemis[j].dans_le_viseur.append(i)
                                self.robots[i].poursuit_ennemi = j
                                self.robots[i].set_couleur(self.canvas, 'green')
                                break
                if self.robots[i].poursuit_ennemi != -1 : # important de revérifier
                    self.robots[i].obj_x, self.robots[i].obj_y = self.ennemis[self.robots[i].poursuit_ennemi].x, self.ennemis[self.robots[i].poursuit_ennemi].y
        
        for i in range(self.nb_robots) :
            self.robots[i].mise_a_jour(self)

        if self.robot_a_suivre != -1 :
            x = int(self.robots[self.robot_a_suivre].x + self.offset_origine_x - self.largeur/2)
            y = int(self.robots[self.robot_a_suivre].y + self.offset_origine_y - self.hauteur/2)
            self.canvas.move("elm", -x, -y)
            self.offset_grille_x += -x
            self.offset_grille_y += -y
            self.offset_origine_x += -x
            self.offset_origine_y += -y
            while self.offset_grille_x < 0 :
                self.offset_grille_x += self.largeur_grille
                self.canvas.move("grille", self.largeur_grille, 0)
            while self.offset_grille_x > self.largeur_grille :
                self.offset_grille_x -= self.largeur_grille
                self.canvas.move("grille", -self.largeur_grille, 0)
            while self.offset_grille_y < 0 :
                self.offset_grille_y += self.largeur_grille
                self.canvas.move("grille", 0, self.largeur_grille)
            while self.offset_grille_y > self.largeur_grille :
                self.offset_grille_y -= self.largeur_grille
                self.canvas.move("grille", 0, -self.largeur_grille)

        self.canvas.itemconfig(self.label_x, text="x: "+str(-self.offset_origine_x))
        self.canvas.itemconfig(self.label_y, text="y: "+str(-self.offset_origine_y))

        MEGA_TIMER += 1
        if MEGA_TIMER < MEGA_TIMER_MAX :
            self.master.after(self.dt, self.mise_a_jour) # Rappelle cette fonction après self.dt millisecondes.
        else :
            self.master.quit()

    def cherche_voisins(self, ind, x, y, r) : # r : rayon de détection
        voisins = []
        distances = [] # au carré
        for j in range(self.nb_robots) :
            if ind != j and self.dist_robots[min(ind,j)][max(ind,j)] < r*r :
                voisins.append(self.robots[j])
                distances.append(self.dist_robots[min(ind,j)][max(ind,j)])
        return voisins, distances

    def emplacement_valide(self, ind, x, y, r, kind='robot') : # kind = ennemi ou robot
        """Retourne True si l'emplacement est libre pour y mettre un robot.

        (x,y) Désigne l'emplacement voulu par le robot.
        """
        valide = True
        
##        for o in self.obstacles :
##            if distance_carre(o.x-x, o.y-y) < (o.r+r)*(o.r+r) :
##                return False

        if kind == 'robot' :
            i = 0
            while valide and i < len(self.robots) : # Les robots ne se chevauchent pas.
                d = self.robots[i].r+r
                if i != ind and distance_carre(self.robots[i].x-x, self.robots[i].y-y) < d*d :
                    valide = False
                i += 1

            i = 0
            while valide and i < len(self.ennemis) : # Les robots ne se chevauchent pas.
                d = self.ennemis[i].r+r
                if distance_carre(self.ennemis[i].x-x, self.ennemis[i].y-y) < d*d :
                    valide = False
                i += 1
        else : # kind == 'ennemi' :
            i = 0
            while valide and i < len(self.robots) : # Les robots ne se chevauchent pas.
                d = self.robots[i].r+r
                if distance_carre(self.robots[i].x-x, self.robots[i].y-y) < d*d :
                    valide = False
                    if i == 0 :
                        print('perdu')
                i += 1

            i = 0
            while valide and i < len(self.ennemis) : # Les robots ne se chevauchent pas.
                d = self.ennemis[i].r+r
                if i != ind and distance_carre(self.ennemis[i].x-x, self.ennemis[i].y-y) < d*d :
                    valide = False
                i += 1
        return valide

    # todo
    def clic_sur_la_fenetre(self, event) :
        pass
##        self.obstacles.append(Obstacle(len(self.obstacles), event.x, event.y, 50, self.canvas, self.offset_origine_x, self.offset_origine_y))

    def suit_autre_robot(self, event) :
        if self.robot_a_suivre != -1 :
            self.robots[self.robot_a_suivre].set_couleur(self.canvas, "red")
        self.robot_a_suivre += 1
        if self.robot_a_suivre >= len(self.robots) :
            self.robot_a_suivre = 0
        self.robots[self.robot_a_suivre].set_couleur(self.canvas, "yellow")

    def suit_aucun_robot(self, event) :
        if self.robot_a_suivre != -1 :
            self.robots[self.robot_a_suivre].set_couleur(self.canvas, "red")
        self.robot_a_suivre = -1

    def touche_pressee(self, event) :
        if self.robot_a_suivre == -1 :
            v = 3 # nb de pixels de déplacement de la caméra (selon x ou y)
            L = ["7", "4", "1"] # gauche
            R = ["9", "6", "3"] # droite
            U = ["7", "8", "9"] # haut
            D = ["1", "2", "3"] # bas
            if event.keysym in R :
                self.canvas.move("elm", -v, 0)
                self.offset_grille_x += -v
                self.offset_origine_x += -v
                if self.offset_grille_x < 0 :
                    self.offset_grille_x += self.largeur_grille
                    self.canvas.move("grille", self.largeur_grille, 0)
            if event.keysym in L :
                self.canvas.move("elm", v, 0)
                self.offset_grille_x += v
                self.offset_origine_x += v
                if self.offset_grille_x > self.largeur_grille :
                    self.offset_grille_x -= self.largeur_grille
                    self.canvas.move("grille", -self.largeur_grille, 0)
            if event.keysym in D :
                self.canvas.move("elm", 0, -v)
                self.offset_grille_y += -v
                self.offset_origine_y += -v
                if self.offset_grille_y < 0 :
                    self.offset_grille_y += self.largeur_grille
                    self.canvas.move("grille", 0, self.largeur_grille)
            if event.keysym in U :
                self.canvas.move("elm", 0, v)
                self.offset_grille_y += v
                self.offset_origine_y += v
                if self.offset_grille_y > self.largeur_grille :
                    self.offset_grille_y -= self.largeur_grille
                    self.canvas.move("grille", 0, -self.largeur_grille)

    def quitter(self) :
        pass
        self.master.destroy() # détruit la fenêtre
        # éventuelle sauvegarde de données

def main() :
    global MEGA_TIMER
    print("Déplacements manuels avec le pavé numérique (1 3 7 9 pour aller en diagonal)")
    print("Touche entrée : suivre le prochain robot. (désactive le controle manuel du pavé numérique)")
    print("Touche p : ne suivre aucun robot. (réactive le controle manuel du pavé numérique)")
    
    for i in range(10) :
        fenetre = tk.Tk()
        interface = Interface(fenetre,720,480,60)
        fenetre.protocol("WM_DELETE_WINDOW", interface.quitter)
        interface.mise_a_jour()
        fenetre.mainloop()
        fenetre.destroy()
        MEGA_TIMER = 0

main()
