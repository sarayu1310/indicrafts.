import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ApprovalList: React.FC<{ status: 'pending' | 'approved' | 'rejected' }> = ({ status }) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [preview, setPreview] = React.useState<{ imageUrl: string; name: string } | null>(null);
    const [priceBreakdown, setPriceBreakdown] = React.useState<any | null>(null);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['admin-products', status],
        queryFn: () => apiService.getAdminProducts({ status, page: 1, limit: 50 }),
    });

    const approveMutation = useMutation({
        mutationFn: (id: string) => apiService.approveAdminProduct(id),
        onSuccess: () => {
            toast({ title: 'Product approved' });
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        },
        onError: (err: any) => toast({ title: 'Approval failed', description: err?.message, variant: 'destructive' }),
    });

    const rejectMutation = useMutation({
        mutationFn: (id: string) => apiService.rejectAdminProduct(id),
        onSuccess: () => {
            toast({ title: 'Product rejected' });
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        },
        onError: (err: any) => toast({ title: 'Rejection failed', description: err?.message, variant: 'destructive' }),
    });

    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Failed to load products</div>;

    const products = (data as any)?.products || [];

    return (
        <Card>
            <CardContent className="p-0">
                <div className="w-full overflow-auto">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                                <TableHead>Image</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Weight</TableHead>
                                <TableHead>Base Price</TableHead>
                                <TableHead>Shipping Cost</TableHead>
                                <TableHead>Distance</TableHead>
                                <TableHead>Total Price</TableHead>
                                <TableHead>Producer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((p: any) => (
                                <TableRow key={p._id}>
                                    <TableCell>
                                        <button type="button" onClick={() => setPreview({ imageUrl: p.imageUrl, name: p.name })}>
                                            <img src={p.imageUrl} alt={p.name} className="w-16 h-16 object-cover rounded" />
                                        </button>
                                    </TableCell>
                                    <TableCell className="font-medium max-w-[220px] truncate">{p.name}</TableCell>
                                    <TableCell>{p.category}</TableCell>
                                    <TableCell>
                                        <div className="text-sm font-medium">{p.weight ? `${p.weight}g` : 'N/A'}</div>
                                        {p.priceBreakdown?.shippingDetails && (
                                            <div className="text-xs text-muted-foreground">
                                                {p.priceBreakdown.shippingDetails.breakdown?.weightCategory}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm font-medium">₹{p.price?.toLocaleString()}</div>
                                        <div className="text-xs text-muted-foreground">Producer Price</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm font-medium">₹{p.shippingCost?.toLocaleString() || '0'}</div>
                                        {p.priceBreakdown?.shippingDetails && (
                                            <div className="text-xs text-muted-foreground">
                                                Weight rate: ₹{p.priceBreakdown.shippingDetails.breakdown?.baseRate} +
                                                Distance: ₹{p.priceBreakdown.shippingDetails.breakdown?.distanceCharge}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {p.priceBreakdown?.shippingDetails && (
                                            <div className="text-sm">
                                                <div className="font-medium">
                                                    {p.priceBreakdown.shippingDetails.breakdown?.distanceKm
                                                        ? `${p.priceBreakdown.shippingDetails.breakdown?.distanceKm} km`
                                                        : (p.priceBreakdown.shippingDetails.breakdown?.distanceCharge > 0 ? `${Math.round(p.priceBreakdown.shippingDetails.breakdown?.distanceCharge / 20)}km+` : 'Local')
                                                    }
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    ₹{p.priceBreakdown.shippingDetails.breakdown?.distanceCharge} surcharge
                                                </div>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm font-bold text-primary">₹{p.totalPrice?.toLocaleString() || p.price?.toLocaleString()}</div>
                                        {p.priceBreakdown && (
                                            <div className="text-xs text-muted-foreground">
                                                +{((p.shippingCost / p.price) * 100).toFixed(1)}% shipping
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {(p.producer?.firstName || p.producerName) || '-'}{p.producer?.email ? ` (${p.producer.email})` : ''}
                                    </TableCell>
                                    <TableCell className="capitalize">{p.approvalStatus || (p.isApproved ? 'approved' : 'pending')}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                    <span className="sr-only">Open actions</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setPriceBreakdown(p)}>
                                                    View Price Breakdown
                                                </DropdownMenuItem>
                                                {(status === 'pending' || status === 'rejected') && (
                                                    <DropdownMenuItem onClick={() => approveMutation.mutate(p._id)}>Approve</DropdownMenuItem>
                                                )}
                                                {(status === 'pending' || status === 'approved') && (
                                                    <DropdownMenuItem onClick={() => rejectMutation.mutate(p._id)}>Reject</DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {products.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={11} className="text-center text-sm text-muted-foreground">No products found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
                <DialogContent className="max-w-md md:max-w-lg w-[95vw] md:w-auto max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{preview?.name}</DialogTitle>
                    </DialogHeader>
                    {preview?.imageUrl && (
                        <img src={preview.imageUrl} alt={preview.name} className="w-full max-h-[70vh] object-contain rounded" />
                    )}
                </DialogContent>
            </Dialog>

            {/* Price Breakdown Modal - Admin Only */}
            <Dialog open={!!priceBreakdown} onOpenChange={(o) => !o && setPriceBreakdown(null)}>
                <DialogContent className="max-w-md md:max-w-lg w-[95vw] md:w-auto max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Price Breakdown - {priceBreakdown?.name}</DialogTitle>
                    </DialogHeader>
                    {priceBreakdown && (
                        <div className="space-y-6">
                            {/* Product Information */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <h4 className="font-semibold text-sm text-gray-600">Product Information</h4>
                                    <p className="text-sm">Name: {priceBreakdown.name}</p>
                                    <p className="text-sm">Category: {priceBreakdown.category}</p>
                                    <p className="text-sm">Weight: {priceBreakdown.weight ? `${priceBreakdown.weight}g` : 'N/A'}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-gray-600">Producer Information</h4>
                                    <p className="text-sm">Producer: {priceBreakdown.producerName || 'N/A'}</p>
                                    <p className="text-sm">Location: {priceBreakdown.producerLocation || 'N/A'}</p>
                                    {priceBreakdown.location && (
                                        <p className="text-sm">GPS: {priceBreakdown.location.latitude?.toFixed(4)}, {priceBreakdown.location.longitude?.toFixed(4)}</p>
                                    )}
                                </div>
                            </div>

                            {/* Detailed Price Breakdown */}
                            <div className="p-4 border rounded-lg">
                                <h4 className="font-semibold text-lg mb-4">Price Breakdown</h4>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b">
                                        <span className="font-medium">Product Price:</span>
                                        <span className="text-lg font-bold">₹{priceBreakdown.price?.toLocaleString()}</span>
                                    </div>

                                    <div className="flex justify-between items-center py-2 border-b">
                                        <span className="font-medium">Shipping Cost:</span>
                                        <span className="text-lg font-bold">₹{priceBreakdown.shippingCost?.toLocaleString() || '0'}</span>
                                    </div>

                                    {priceBreakdown.priceBreakdown?.commission !== undefined && (
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="font-medium">Admin Commission (5%):</span>
                                            <span className="text-lg font-bold">₹{priceBreakdown.priceBreakdown.commission?.toLocaleString()}</span>
                                        </div>
                                    )}

                                    {priceBreakdown.priceBreakdown?.sellerPayout !== undefined && (
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="font-medium">Seller Payout:</span>
                                            <span className="text-lg font-bold">₹{priceBreakdown.priceBreakdown.sellerPayout?.toLocaleString()}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center py-2 border-b-2 border-primary">
                                        <span className="font-bold text-lg">Total Price:</span>
                                        <span className="text-xl font-bold text-primary">₹{priceBreakdown.totalPrice?.toLocaleString() || priceBreakdown.price?.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Shipping Details */}
                                {priceBreakdown.priceBreakdown?.shippingDetails && (
                                    <div className="mt-4 p-3 bg-blue-50 rounded">
                                        <h5 className="font-semibold text-sm text-blue-900 mb-2">Shipping Details</h5>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span>Weight Category:</span>
                                                <span>{priceBreakdown.priceBreakdown.shippingDetails.breakdown?.weightCategory}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Base Rate:</span>
                                                <span>₹{priceBreakdown.priceBreakdown.shippingDetails.breakdown?.baseRate}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Distance Charge:</span>
                                                <span>₹{priceBreakdown.priceBreakdown.shippingDetails.breakdown?.distanceCharge}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Distance (km):</span>
                                                <span>
                                                    {priceBreakdown.priceBreakdown.shippingDetails.breakdown?.distanceKm ?? priceBreakdown.priceBreakdown.shippingDetails.distanceKm ?? 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between font-semibold">
                                                <span>Total Shipping:</span>
                                                <span>₹{priceBreakdown.priceBreakdown.shippingDetails.totalCost}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Customer Impact */}
                                <div className="mt-4 p-3 bg-green-50 rounded">
                                    <h5 className="font-semibold text-sm text-green-900 mb-2">Customer Impact</h5>
                                    <div className="text-sm">
                                        <p>This is what the customer will see and pay:</p>
                                        <p className="font-semibold text-green-800">
                                            Total Customer Price: ₹{priceBreakdown.totalPrice?.toLocaleString() || priceBreakdown.price?.toLocaleString()}
                                        </p>
                                        {priceBreakdown.shippingCost && priceBreakdown.price && (
                                            <p className="text-green-700">
                                                Shipping adds {((priceBreakdown.shippingCost / priceBreakdown.price) * 100).toFixed(1)}% to the base price
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
};

const ApprovalsPage: React.FC = () => {
    const [status, setStatus] = React.useState<'pending' | 'approved' | 'rejected'>('pending');
    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-xl font-semibold">Product Approvals</h1>
                <div className="flex items-center gap-2">
                    <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <ApprovalList status={status} />
        </div>
    );
};

export default ApprovalsPage;


