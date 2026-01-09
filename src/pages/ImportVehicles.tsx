import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Upload, 
  FileText, 
  Car, 
  Image, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  Download
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface VehiclePreview {
  brand: string;
  model: string;
  version: string | null;
  year_fabrication: number;
  year_model: number;
  km: number;
  sale_price: number | null;
  plate: string | null;
  color: string;
  fuel_type: string;
  transmission: string;
  mercadolibre_id: string | null;
}

interface ImportResult {
  success: boolean;
  total: number;
  active: number;
  inserted?: number;
  duplicates?: number;
  errors?: string[];
  vehicles?: VehiclePreview[];
  message: string;
}

interface PhotoImportResult {
  success: boolean;
  processed: number;
  successful: number;
  failed: number;
  noPhotos: number;
  message: string;
  results?: Array<{
    vehicle: string;
    status: string;
    photosUploaded?: number;
    message?: string;
  }>;
}

export default function ImportVehicles() {
  const [xmlContent, setXmlContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ImportResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [photoImportResult, setPhotoImportResult] = useState<PhotoImportResult | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'photos' | 'done'>('upload');
  const [progress, setProgress] = useState(0);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xml')) {
      toast.error('Por favor, selecione um arquivo XML');
      return;
    }

    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setXmlContent(content);
      toast.success(`Arquivo ${file.name} carregado com sucesso`);
    };
    reader.onerror = () => {
      toast.error('Erro ao ler o arquivo');
    };
    reader.readAsText(file, 'ISO-8859-1');
  };

  const handlePreview = async () => {
    if (!xmlContent) {
      toast.error('Nenhum arquivo XML carregado');
      return;
    }

    setIsLoading(true);
    setProgress(20);

    try {
      const { data, error } = await supabase.functions.invoke('import-vehicles', {
        body: { xmlContent, dryRun: true }
      });

      if (error) throw error;

      setPreviewData(data as ImportResult);
      setStep('preview');
      setProgress(100);
      toast.success(`${data.active} veículos ativos encontrados para importar`);
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Erro ao processar XML: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!xmlContent) {
      toast.error('Nenhum arquivo XML carregado');
      return;
    }

    setIsLoading(true);
    setStep('importing');
    setProgress(10);

    try {
      const { data, error } = await supabase.functions.invoke('import-vehicles', {
        body: { xmlContent, dryRun: false }
      });

      if (error) throw error;

      setImportResult(data as ImportResult);
      setProgress(50);
      toast.success(data.message);
      
      await handlePhotoImport();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erro na importação: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
      setStep('preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoImport = async () => {
    setStep('photos');
    setProgress(60);

    try {
      let totalProcessed = 0;
      let allResults: PhotoImportResult['results'] = [];
      
      for (let batch = 0; batch < 20; batch++) {
        setProgress(60 + (batch * 2));
        
        const { data, error } = await supabase.functions.invoke('import-vehicle-photos', {
          body: { limit: 10 }
        });

        if (error) {
          console.error('Photo import batch error:', error);
          break;
        }

        const batchResult = data as PhotoImportResult;
        
        if (batchResult.processed === 0) {
          break;
        }

        totalProcessed += batchResult.processed;
        if (batchResult.results) {
          allResults = [...allResults, ...batchResult.results];
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setPhotoImportResult({
        success: true,
        processed: totalProcessed,
        successful: allResults.filter(r => r.status === 'success').length,
        failed: allResults.filter(r => r.status === 'error').length,
        noPhotos: allResults.filter(r => r.status === 'no_photos').length,
        message: `Processados ${totalProcessed} veículos para importação de fotos`,
        results: allResults
      });

      setStep('done');
      setProgress(100);
      toast.success(`Importação de fotos concluída! ${allResults.filter(r => r.status === 'success').length} veículos com fotos`);
    } catch (error) {
      console.error('Photo import error:', error);
      toast.error('Erro na importação de fotos');
      setStep('done');
    }
  };

  const handleReset = () => {
    setXmlContent('');
    setFileName('');
    setPreviewData(null);
    setImportResult(null);
    setPhotoImportResult(null);
    setStep('upload');
    setProgress(0);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatKm = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value) + ' km';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Importar Veículos</h1>
          <p className="text-muted-foreground">
            Importe veículos do XML e fotos do Mercado Livre
          </p>
        </div>
        {step !== 'upload' && (
          <Button variant="outline" onClick={handleReset}>
            Nova Importação
          </Button>
        )}
      </div>

      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processando...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Carregar Arquivo XML
            </CardTitle>
            <CardDescription>
              Selecione o arquivo XML exportado do sistema de estoque
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".xml"
                onChange={handleFileUpload}
                className="hidden"
                id="xml-upload"
              />
              <label 
                htmlFor="xml-upload" 
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <FileText className="h-12 w-12 text-muted-foreground" />
                <span className="text-lg font-medium">
                  {fileName || 'Clique para selecionar o arquivo XML'}
                </span>
                <span className="text-sm text-muted-foreground">
                  Formato aceito: .xml
                </span>
              </label>
            </div>

            {xmlContent && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>{fileName}</span>
                  <Badge variant="secondary">
                    {(xmlContent.length / 1024).toFixed(1)} KB
                  </Badge>
                </div>
                <Button onClick={handlePreview} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Analisar XML'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'preview' && previewData && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Car className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{previewData.total}</p>
                    <p className="text-sm text-muted-foreground">Total no XML</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{previewData.active}</p>
                    <p className="text-sm text-muted-foreground">Veículos Ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Image className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {previewData.vehicles?.filter(v => v.mercadolibre_id).length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Com ML ID (fotos)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <XCircle className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{previewData.total - previewData.active}</p>
                    <p className="text-sm text-muted-foreground">Inativos (ignorados)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Preview dos Veículos (primeiros 10)</CardTitle>
              <CardDescription>
                Verifique os dados antes de importar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Marca/Modelo</TableHead>
                      <TableHead>Ano</TableHead>
                      <TableHead>KM</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Cor</TableHead>
                      <TableHead>Câmbio</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>ML ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.vehicles?.map((vehicle, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {vehicle.brand} {vehicle.model}
                          {vehicle.version && (
                            <span className="text-muted-foreground ml-1 text-xs">
                              {vehicle.version}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{vehicle.year_model}</TableCell>
                        <TableCell>{formatKm(vehicle.km)}</TableCell>
                        <TableCell>{formatCurrency(vehicle.sale_price)}</TableCell>
                        <TableCell>{vehicle.color}</TableCell>
                        <TableCell className="capitalize">{vehicle.transmission}</TableCell>
                        <TableCell>{vehicle.plate || '-'}</TableCell>
                        <TableCell>
                          {vehicle.mercadolibre_id ? (
                            <Badge variant="secondary" className="text-xs">
                              {vehicle.mercadolibre_id}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={handleReset}>
                  Cancelar
                </Button>
                <Button onClick={handleImport} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Importar {previewData.active} Veículos
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {(step === 'importing' || step === 'photos') && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">
                {step === 'importing' ? 'Importando veículos...' : 'Importando fotos do Mercado Livre...'}
              </p>
              <p className="text-muted-foreground text-sm">
                {step === 'photos' && 'Isso pode levar alguns minutos'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'done' && (
        <>
          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Importação de Veículos Concluída
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-green-500">{importResult.inserted}</p>
                    <p className="text-sm text-muted-foreground">Importados</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-yellow-500">{importResult.duplicates}</p>
                    <p className="text-sm text-muted-foreground">Duplicados</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-red-500">{importResult.errors?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Erros</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{importResult.active}</p>
                    <p className="text-sm text-muted-foreground">Total Processados</p>
                  </div>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Erros durante importação
                    </h4>
                    <ul className="text-sm space-y-1">
                      {importResult.errors.slice(0, 10).map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                      {importResult.errors.length > 10 && (
                        <li className="text-muted-foreground">
                          ... e mais {importResult.errors.length - 10} erros
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {photoImportResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-blue-500" />
                  Importação de Fotos Concluída
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-green-500">{photoImportResult.successful}</p>
                    <p className="text-sm text-muted-foreground">Com Fotos</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-yellow-500">{photoImportResult.noPhotos}</p>
                    <p className="text-sm text-muted-foreground">Sem Fotos no ML</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-red-500">{photoImportResult.failed}</p>
                    <p className="text-sm text-muted-foreground">Erros</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{photoImportResult.processed}</p>
                    <p className="text-sm text-muted-foreground">Total Processados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={handleReset}>
              Nova Importação
            </Button>
            <Button onClick={() => window.location.href = '/estoque'}>
              Ver Estoque
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
