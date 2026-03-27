from django.contrib.gis.db import models # Mantendo o GIS para o futuro

class Proprietario(models.Model):
    nome = models.CharField(max_length=255)
    endereco = models.CharField(max_length=255)
    telefone = models.CharField(max_length=20)
    
    # Coordenadas (Latitude e Longitude salvas separadamente para facilitar)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    def __str__(self):
        return self.nome

class Pet(models.Model):
    SEXO_CHOICES = [('M', 'Macho'), ('F', 'Fêmea')]
    STATUS_GERAL_CHOICES = [
        ('SUSPEITO', 'Suspeito'),
        ('POSITIVO', 'Positivo (Confirmado)'),
        ('NEGATIVO', 'Negativo'),
        ('OBITO', 'Óbito'),
        ('EM_TRATAMENTO', 'Em Tratamento'),
    ]
    PELAGEM_TAMANHO_CHOICES = [('CURTO', 'Curto'), ('MEDIO', 'Médio'), ('LONGO', 'Longo')]

    proprietario = models.ForeignKey(Proprietario, related_name='pets', on_delete=models.CASCADE)
    nome = models.CharField(max_length=100)
    
    # Identificação
    especie = models.CharField(max_length=50, default="Canina")
    raca = models.CharField(max_length=100, blank=True, null=True, verbose_name="Raça")
    sexo = models.CharField(max_length=1, choices=SEXO_CHOICES)
    
    # Idade Detalhada
    idade_anos = models.IntegerField(default=0, verbose_name="Anos")
    idade_meses = models.IntegerField(default=0, verbose_name="Meses")
    
    # Pelagem
    pelagem_tamanho = models.CharField(max_length=20, choices=PELAGEM_TAMANHO_CHOICES, default='CURTO')
    pelagem_cor = models.CharField(max_length=50, blank=True, null=True)

    # Vacinação (Protocolo Completo)
    tomou_dose_1 = models.BooleanField(default=False, verbose_name="1ª Dose")
    data_dose_1 = models.DateField(null=True, blank=True)
    
    tomou_dose_2 = models.BooleanField(default=False, verbose_name="2ª Dose")
    data_dose_2 = models.DateField(null=True, blank=True)
    
    tomou_dose_3 = models.BooleanField(default=False, verbose_name="3ª Dose (Reforço)")
    data_dose_3 = models.DateField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_GERAL_CHOICES, default='SUSPEITO')
    foto = models.ImageField(upload_to='pets/', null=True, blank=True)
    data_cadastro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nome} ({self.status})"

class Visita(models.Model):
    RESULTADO_CHOICES = [
        ('REAGENTE', 'Reagente'),
        ('NAO_REAGENTE', 'Não Reagente'),
        ('NAO_REALIZADO', 'Não Realizado'),
    ]

    INQUERITO_CHOICES = [
        ('CENSITARIO', 'Censitário'),
        ('AMOSTRAL', 'Amostral'),
        ('ESPONTANEO', 'Demanda Espontânea'),
    ]

    pet = models.ForeignKey(Pet, related_name='visitas', on_delete=models.CASCADE)
    data_visita = models.DateField()
    tipo_inquerito = models.CharField(max_length=20, choices=INQUERITO_CHOICES, default='CENSITARIO')

    # Sinais Clínicos (Checklist)
    tem_emagrecimento = models.BooleanField(default=False, verbose_name="Emagrecimento")
    tem_alopecia = models.BooleanField(default=False, verbose_name="Alopecia (Queda de Pelo)")
    tem_descamacao = models.BooleanField(default=False, verbose_name="Descamação/Caspa")
    tem_onicogrifose = models.BooleanField(default=False, verbose_name="Onicogrifose (Unhas Grandes)")
    tem_feridas = models.BooleanField(default=False, verbose_name="Feridas/Úlceras")
    
    # Diagnóstico Laboratorial
    resultado_elisa = models.CharField(max_length=20, choices=RESULTADO_CHOICES, default='NAO_REALIZADO')
    resultado_dpp = models.CharField(max_length=20, choices=RESULTADO_CHOICES, default='NAO_REALIZADO') # Teste Rápido

    # Prevenção
    usa_coleira = models.BooleanField(default=False)
    vacinado = models.BooleanField(default=False)

    observacoes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Visita {self.data_visita} - {self.pet.nome}"

class Medicacao(models.Model):
    pet = models.ForeignKey(Pet, related_name='medicacoes', on_delete=models.CASCADE)
    nome = models.CharField(max_length=100)  # Ex: Milteforan, Alopurinol, Coleira Deltametrina
    data_inicio = models.DateField()
    dose = models.CharField(max_length=100, blank=True, null=True)
    observacoes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.nome} - {self.pet.nome}"
    

class FotoEvolucao(models.Model):
    pet = models.ForeignKey(Pet, related_name='galeria', on_delete=models.CASCADE)
    # Opcional: vincular a uma visita específica para saber em qual consulta a foto foi tirada
    visita = models.ForeignKey(Visita, related_name='fotos_clinicas', on_delete=models.CASCADE, null=True, blank=True)
    foto = models.ImageField(upload_to='evolucao/')
    legenda = models.CharField(max_length=255, blank=True, null=True)
    data_registro = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"Evolução: {self.pet.nome} - {self.data_registro}"